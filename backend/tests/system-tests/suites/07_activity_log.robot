*** Settings ***
Documentation
...    System tests for:
...      GET /api/activity-log/   (admin only)
Resource          ../resources/common.resource
Resource          ../resources/auth.resource

Suite Setup       Create API Session
Suite Teardown    Delete API Session

*** Variables ***
${ACTIVITY_LOG_PATH}    /api/activity-log/

*** Test Cases ***

Get Activity Log Without Auth Returns 401
    [Tags]    activity-log    negative
    ${resp}=    GET On Session    api    ${ACTIVITY_LOG_PATH}    expected_status=401
    Response Should Be Unauthorized    ${resp}

Get Activity Log As Admin Returns 200
    [Tags]    activity-log    smoke
    ${headers}=    Admin Auth Header
    ${resp}=    GET On Session    api    ${ACTIVITY_LOG_PATH}    headers=${headers}
    Response Should Be OK    ${resp}
    Should Be True    isinstance($resp.json(), list)

Get Activity Log Response Is A List
    [Tags]    activity-log    smoke
    ${headers}=    Admin Auth Header
    ${resp}=    GET On Session    api    ${ACTIVITY_LOG_PATH}    headers=${headers}
    Response Should Be OK    ${resp}
    ${body}=    Set Variable    ${resp.json()}
    Should Be True    isinstance($body, list)

Get Activity Log Entries Have Required Fields
    [Tags]    activity-log
    ${headers}=    Admin Auth Header
    ${resp}=    GET On Session    api    ${ACTIVITY_LOG_PATH}    headers=${headers}
    ${entries}=    Set Variable    ${resp.json()}
    Skip If    len($entries) == 0    No activity log entries in DB
    ${first}=    Set Variable    ${entries}[0]
    Dictionary Should Contain Key    ${first}    event_type
    Dictionary Should Contain Key    ${first}    user_id
    Dictionary Should Contain Key    ${first}    timestamp
