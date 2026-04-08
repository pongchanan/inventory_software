*** Settings ***
Documentation
...    System tests for:
...      GET   /api/users/
...      GET   /api/users/{user_id}
...      PATCH /api/users/{user_id}
...    All endpoints require admin role.
Resource          ../resources/common.resource
Resource          ../resources/auth.resource

Suite Setup       Create API Session
Suite Teardown    Delete API Session

*** Variables ***
${USERS_PATH}    /api/users/

*** Test Cases ***

List Users As Admin Returns 200
    [Tags]    users    smoke
    ${headers}=    Admin Auth Header
    ${resp}=    GET On Session    api    ${USERS_PATH}    headers=${headers}
    Response Should Be OK    ${resp}
    Should Be True    isinstance($resp.json(), list)

List Users Returns User Fields
    [Tags]    users    smoke
    ${headers}=    Admin Auth Header
    ${resp}=    GET On Session    api    ${USERS_PATH}    headers=${headers}
    Response Should Be OK    ${resp}
    ${users}=    Set Variable    ${resp.json()}
    Skip If    len($users) == 0    No users in DB
    ${first}=    Set Variable    ${users}[0]
    Dictionary Should Contain Key    ${first}    id
    Dictionary Should Contain Key    ${first}    name
    Dictionary Should Contain Key    ${first}    email
    Dictionary Should Contain Key    ${first}    role

List Users Without Auth Returns 403
    [Tags]    users    negative
    [Documentation]    FastAPI HTTPBearer returns 403 when no Authorization header is present.
    ${resp}=    GET On Session    api    ${USERS_PATH}    expected_status=403
    Response Should Be Forbidden    ${resp}

Get User By Id As Admin Returns 200
    [Tags]    users    smoke
    ${headers}=    Admin Auth Header
    # First get the admin's own ID via /me
    ${me}=    GET On Session    api    /api/auth/me    headers=${headers}
    ${admin_id}=    Set Variable    ${me.json()}[id]
    ${resp}=    GET On Session    api    ${USERS_PATH}${admin_id}    headers=${headers}
    Response Should Be OK    ${resp}
    Should Be Equal As Integers    ${resp.json()}[id]    ${admin_id}

Get Non-Existent User Returns 404
    [Tags]    users    negative
    ${headers}=    Admin Auth Header
    ${resp}=    GET On Session    api    ${USERS_PATH}999999
    ...    headers=${headers}    expected_status=404
    Response Should Be Not Found    ${resp}

Update User Name As Admin Returns 200
    [Tags]    users
    ${headers}=    Admin Auth Header
    ${me}=    GET On Session    api    /api/auth/me    headers=${headers}
    ${admin_id}=    Set Variable    ${me.json()}[id]
    ${original_name}=    Set Variable    ${me.json()}[name]
    # Patch with a temporary name
    ${patch_body}=    Create Dictionary    name=TempRobotName
    ${resp}=    PATCH On Session    api    ${USERS_PATH}${admin_id}
    ...    json=${patch_body}    headers=${headers}
    Response Should Be OK    ${resp}
    Should Be Equal    ${resp.json()}[name]    TempRobotName
    # Restore original name
    ${restore}=    Create Dictionary    name=${original_name}
    PATCH On Session    api    ${USERS_PATH}${admin_id}
    ...    json=${restore}    headers=${headers}    expected_status=200

Update Non-Existent User Returns 404
    [Tags]    users    negative
    ${headers}=    Admin Auth Header
    ${body}=    Create Dictionary    name=Ghost
    ${resp}=    PATCH On Session    api    ${USERS_PATH}999999
    ...    json=${body}    headers=${headers}    expected_status=404
    Response Should Be Not Found    ${resp}
