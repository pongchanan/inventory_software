*** Settings ***
Documentation
...    System tests for:
...      GET /api/borrowings/me              (current user)
...      GET /api/borrowings/admin/all       (admin)
...      GET /api/borrowings/users/{user_id} (admin)
...      GET /api/borrowings/popular         (admin)
Resource          ../resources/common.resource
Resource          ../resources/auth.resource

Suite Setup       Create API Session
Suite Teardown    Delete API Session

*** Variables ***
${BORROWINGS_PATH}    /api/borrowings/

*** Test Cases ***

Get My Borrowings Without Auth Returns 403
    [Tags]    borrowings    negative
    [Documentation]    FastAPI HTTPBearer returns 403 when no Authorization header is present.
    ${resp}=    GET On Session    api    ${BORROWINGS_PATH}me    expected_status=403
    Response Should Be Forbidden    ${resp}

Get My Borrowings As Admin Returns Paginated Response
    [Tags]    borrowings    smoke
    ${headers}=    Admin Auth Header
    ${resp}=    GET On Session    api    ${BORROWINGS_PATH}me    headers=${headers}
    Response Should Be OK    ${resp}
    ${json}=    Set Variable    ${resp.json()}
    Dictionary Should Contain Key    ${json}    borrowings
    Dictionary Should Contain Key    ${json}    total
    Dictionary Should Contain Key    ${json}    page
    Dictionary Should Contain Key    ${json}    page_size
    Dictionary Should Contain Key    ${json}    total_pages

Get My Borrowings Default Page Is 1
    [Tags]    borrowings
    ${headers}=    Admin Auth Header
    ${resp}=    GET On Session    api    ${BORROWINGS_PATH}me    headers=${headers}
    Should Be Equal As Integers    ${resp.json()}[page]    1

Get All Borrowings Admin Without Auth Returns 403
    [Tags]    borrowings    negative
    [Documentation]    FastAPI HTTPBearer returns 403 when no Authorization header is present.
    ${resp}=    GET On Session    api    ${BORROWINGS_PATH}admin/all    expected_status=403
    Response Should Be Forbidden    ${resp}

Get All Borrowings Admin Returns Paginated Response
    [Tags]    borrowings    smoke
    ${headers}=    Admin Auth Header
    ${resp}=    GET On Session    api    ${BORROWINGS_PATH}admin/all    headers=${headers}
    Response Should Be OK    ${resp}
    ${json}=    Set Variable    ${resp.json()}
    Dictionary Should Contain Key    ${json}    borrowings
    Dictionary Should Contain Key    ${json}    total
    Dictionary Should Contain Key    ${json}    total_pages

Get Borrowings By User ID As Admin Returns 200
    [Tags]    borrowings    smoke
    ${headers}=    Admin Auth Header
    ${me}=    GET On Session    api    /api/auth/me    headers=${headers}
    ${admin_id}=    Set Variable    ${me.json()}[id]
    ${resp}=    GET On Session    api    ${BORROWINGS_PATH}users/${admin_id}    headers=${headers}
    Response Should Be OK    ${resp}
    Dictionary Should Contain Key    ${resp.json()}    borrowings

Get Borrowings By Non-Existent User Returns Paginated Empty
    [Tags]    borrowings
    ${headers}=    Admin Auth Header
    ${resp}=    GET On Session    api    ${BORROWINGS_PATH}users/999999    headers=${headers}
    Response Should Be OK    ${resp}
    Should Be Equal As Integers    ${resp.json()}[total]    0

Get Popular Items Without Auth Returns 403
    [Tags]    borrowings    negative
    [Documentation]    FastAPI HTTPBearer returns 403 when no Authorization header is present.
    ${resp}=    GET On Session    api    ${BORROWINGS_PATH}popular    expected_status=403
    Response Should Be Forbidden    ${resp}

Get Popular Items As Admin Returns Paginated Response
    [Tags]    borrowings    smoke
    ${headers}=    Admin Auth Header
    ${resp}=    GET On Session    api    ${BORROWINGS_PATH}popular    headers=${headers}
    Response Should Be OK    ${resp}
    ${json}=    Set Variable    ${resp.json()}
    Dictionary Should Contain Key    ${json}    items
    Dictionary Should Contain Key    ${json}    total
    Dictionary Should Contain Key    ${json}    total_pages

Get Popular Items Page Size Respected
    [Tags]    borrowings
    ${headers}=    Admin Auth Header
    ${params}=    Create Dictionary    page=1    page_size=3
    ${resp}=    GET On Session    api    ${BORROWINGS_PATH}popular
    ...    headers=${headers}    params=${params}
    Response Should Be OK    ${resp}
    Should Be Equal As Integers    ${resp.json()}[page_size]    3

Get Popular Items Each Row Has Required Fields
    [Tags]    borrowings
    ${headers}=    Admin Auth Header
    ${resp}=    GET On Session    api    ${BORROWINGS_PATH}popular    headers=${headers}
    ${items}=    Set Variable    ${resp.json()}[items]
    Skip If    len($items) == 0    No borrowing data to assert fields on
    ${first}=    Set Variable    ${items}[0]
    Dictionary Should Contain Key    ${first}    item_id
    Dictionary Should Contain Key    ${first}    name
    Dictionary Should Contain Key    ${first}    borrow_count
