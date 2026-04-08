*** Settings ***
Documentation
...    System tests for:
...      GET  /api/items/
...      PATCH /api/items/{item_id}/quantity
Resource          ../resources/common.resource
Resource          ../resources/auth.resource

Suite Setup       Create API Session
Suite Teardown    Delete API Session

*** Variables ***
${ITEMS_PATH}     /api/items/

*** Test Cases ***

List Active Items Returns Paginated Response
    [Tags]    items    smoke
    ${resp}=    GET On Session    api    ${ITEMS_PATH}
    Response Should Be OK    ${resp}
    ${json}=    Set Variable    ${resp.json()}
    Dictionary Should Contain Key    ${json}    items
    Dictionary Should Contain Key    ${json}    total
    Dictionary Should Contain Key    ${json}    page
    Dictionary Should Contain Key    ${json}    page_size
    Dictionary Should Contain Key    ${json}    total_pages

List Active Items Default Page Is 1
    [Tags]    items    smoke
    ${resp}=    GET On Session    api    ${ITEMS_PATH}
    Response Should Be OK    ${resp}
    Should Be Equal As Integers    ${resp.json()}[page]    1

List Active Items Accepts Custom Page Size
    [Tags]    items
    ${params}=    Create Dictionary    page=1    page_size=5
    ${resp}=    GET On Session    api    ${ITEMS_PATH}    params=${params}
    Response Should Be OK    ${resp}
    Should Be Equal As Integers    ${resp.json()}[page_size]    5

List Active Items Page Size Zero Returns 422
    [Tags]    items    negative
    ${params}=    Create Dictionary    page=1    page_size=0
    ${resp}=    GET On Session    api    ${ITEMS_PATH}
    ...    params=${params}    expected_status=422
    Should Be Equal As Integers    ${resp.status_code}    422

List Active Items Each Item Has Required Fields
    [Tags]    items    smoke
    ${resp}=    GET On Session    api    ${ITEMS_PATH}
    Response Should Be OK    ${resp}
    ${items}=    Set Variable    ${resp.json()}[items]
    IF    len($items) > 0
        ${first}=    Set Variable    ${items}[0]
        Dictionary Should Contain Key    ${first}    id
        Dictionary Should Contain Key    ${first}    name
        Dictionary Should Contain Key    ${first}    quantity
        Dictionary Should Contain Key    ${first}    is_active
        Dictionary Should Contain Key    ${first}    image
    END

Adjust Item Quantity Without Auth Returns 403
    [Tags]    items    negative
    [Documentation]    FastAPI HTTPBearer returns 403 when no Authorization header is present.
    ${body}=    Create Dictionary    delta=1
    ${resp}=    PATCH On Session    api    /api/items/1/quantity
    ...    json=${body}    expected_status=403
    Response Should Be Forbidden    ${resp}

Adjust Item Quantity As Non-Admin Returns 403
    [Tags]    items    negative
    [Documentation]    Regular users (role=user) must be rejected with 403.
    # Skip if no regular user credentials are configured
    Skip If    '${USER_EMAIL}' == ''    No USER_EMAIL variable configured
    ${headers}=    User Auth Header    ${USER_EMAIL}    ${USER_PASSWORD}
    ${body}=    Create Dictionary    delta=1
    ${resp}=    PATCH On Session    api    /api/items/1/quantity
    ...    json=${body}    headers=${headers}    expected_status=403
    Response Should Be Forbidden    ${resp}

Adjust Item Quantity With Delta Zero Is Accepted By Admin
    [Tags]    items
    [Documentation]    delta=0 is a no-op but must be accepted (not a 4xx).
    ${headers}=    Admin Auth Header
    ${resp}=    GET On Session    api    ${ITEMS_PATH}
    ${items}=    Set Variable    ${resp.json()}[items]
    Skip If    len($items) == 0    No items in DB to test with
    ${item_id}=    Set Variable    ${items}[0][id]
    ${body}=    Create Dictionary    delta=${0}
    ${resp}=    PATCH On Session    api    /api/items/${item_id}/quantity
    ...    json=${body}    headers=${headers}
    Response Should Be OK    ${resp}

Adjust Item Quantity Below Zero Returns 400
    [Tags]    items    negative
    ${headers}=    Admin Auth Header
    ${resp}=    GET On Session    api    ${ITEMS_PATH}
    ${items}=    Set Variable    ${resp.json()}[items]
    Skip If    len($items) == 0    No items in DB to test with
    ${item_id}=    Set Variable    ${items}[0][id]
    # Use a very large negative delta to guarantee underflow
    ${body}=    Create Dictionary    delta=${-999999}
    ${resp}=    PATCH On Session    api    /api/items/${item_id}/quantity
    ...    json=${body}    headers=${headers}    expected_status=400
    Response Should Be Bad Request    ${resp}

Adjust Non-Existent Item Returns 400
    [Tags]    items    negative
    ${headers}=    Admin Auth Header
    ${body}=    Create Dictionary    delta=${1}
    ${resp}=    PATCH On Session    api    /api/items/999999/quantity
    ...    json=${body}    headers=${headers}    expected_status=400
    Response Should Be Bad Request    ${resp}

*** Variables ***
${USER_EMAIL}       ${EMPTY}
${USER_PASSWORD}    ${EMPTY}
