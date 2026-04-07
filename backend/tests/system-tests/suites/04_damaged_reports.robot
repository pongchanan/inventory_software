*** Settings ***
Documentation
...    System tests for:
...      GET  /api/damaged-reports/           (admin)
...      GET  /api/damaged-reports/me         (current user)
...      GET  /api/damaged-reports/user/{id}  (admin)
...      GET  /api/damaged-reports/{id}/image (authenticated)
...      POST /api/damaged-reports/{id}/approve (admin)
...      GET  /api/damaged-reports/export     (admin)
Resource          ../resources/common.resource
Resource          ../resources/auth.resource

Suite Setup       Create API Session
Suite Teardown    Delete API Session

*** Variables ***
${REPORTS_PATH}    /api/damaged-reports/

*** Test Cases ***

List All Reports As Admin Returns 200
    [Tags]    damaged-reports    smoke
    ${headers}=    Admin Auth Header
    ${resp}=    GET On Session    api    ${REPORTS_PATH}    headers=${headers}
    Response Should Be OK    ${resp}
    Should Be True    isinstance($resp.json(), list)

List All Reports Response Has Required Fields
    [Tags]    damaged-reports    smoke
    ${headers}=    Admin Auth Header
    ${resp}=    GET On Session    api    ${REPORTS_PATH}    headers=${headers}
    ${reports}=    Set Variable    ${resp.json()}
    Skip If    len($reports) == 0    No reports in DB
    ${first}=    Set Variable    ${reports}[0]
    Dictionary Should Contain Key    ${first}    id
    Dictionary Should Contain Key    ${first}    topic
    Dictionary Should Contain Key    ${first}    approved
    Dictionary Should Contain Key    ${first}    illustrated_path

List All Reports Without Auth Returns 401
    [Tags]    damaged-reports    negative
    ${resp}=    GET On Session    api    ${REPORTS_PATH}    expected_status=401
    Response Should Be Unauthorized    ${resp}

Get My Reports Without Auth Returns 401
    [Tags]    damaged-reports    negative
    ${resp}=    GET On Session    api    ${REPORTS_PATH}me    expected_status=401
    Response Should Be Unauthorized    ${resp}

Get My Reports As Admin Returns 200
    [Tags]    damaged-reports    smoke
    ${headers}=    Admin Auth Header
    ${resp}=    GET On Session    api    ${REPORTS_PATH}me    headers=${headers}
    Response Should Be OK    ${resp}
    Should Be True    isinstance($resp.json(), list)

Get Reports By User ID As Admin Returns 200
    [Tags]    damaged-reports
    ${headers}=    Admin Auth Header
    ${me}=    GET On Session    api    /api/auth/me    headers=${headers}
    ${admin_id}=    Set Variable    ${me.json()}[id]
    ${resp}=    GET On Session    api    ${REPORTS_PATH}user/${admin_id}    headers=${headers}
    Response Should Be OK    ${resp}
    Should Be True    isinstance($resp.json(), list)

Get Reports By Non-Existent User Returns Empty List
    [Tags]    damaged-reports
    ${headers}=    Admin Auth Header
    ${resp}=    GET On Session    api    ${REPORTS_PATH}user/999999    headers=${headers}
    Response Should Be OK    ${resp}
    Should Be Equal    ${resp.json()}    ${EMPTY LIST}

Get Image Of Non-Existent Report Returns 404
    [Tags]    damaged-reports    negative
    ${headers}=    Admin Auth Header
    ${resp}=    GET On Session    api    ${REPORTS_PATH}999999/image
    ...    headers=${headers}    expected_status=404
    Response Should Be Not Found    ${resp}

Approve Non-Existent Report Returns 404
    [Tags]    damaged-reports    negative
    ${headers}=    Admin Auth Header
    ${body}=    Create Dictionary    admin_comment=test
    ${resp}=    POST On Session    api    ${REPORTS_PATH}999999/approve
    ...    json=${body}    headers=${headers}    expected_status=404
    Response Should Be Not Found    ${resp}

Approve Report Without Auth Returns 401
    [Tags]    damaged-reports    negative
    ${body}=    Create Dictionary    admin_comment=test
    ${resp}=    POST On Session    api    ${REPORTS_PATH}1/approve
    ...    json=${body}    expected_status=401
    Response Should Be Unauthorized    ${resp}

Approve Report As Admin With Comment Returns 200 When Report Exists
    [Tags]    damaged-reports
    [Documentation]
    ...    Approves the first unapproved report found.
    ...    Skips if no unapproved reports exist.
    ${headers}=    Admin Auth Header
    ${resp}=    GET On Session    api    ${REPORTS_PATH}    headers=${headers}
    ${reports}=    Set Variable    ${resp.json()}
    # Find first unapproved report
    ${target_id}=    Set Variable    ${None}
    FOR    ${r}    IN    @{reports}
        IF    not $r['approved']
            ${target_id}=    Set Variable    ${r}[id]
            BREAK
        END
    END
    Skip If    $target_id is None    No unapproved reports to test approve with
    ${body}=    Create Dictionary    admin_comment=Confirmed by robot test
    ${resp}=    POST On Session    api    ${REPORTS_PATH}${target_id}/approve
    ...    json=${body}    headers=${headers}
    Response Should Be OK    ${resp}
    Should Be True    ${resp.json()}[approved]
    Should Be Equal    ${resp.json()}[admin_comment]    Confirmed by robot test

Approve Already Approved Report Is Idempotent
    [Tags]    damaged-reports
    [Documentation]
    ...    Calling approve twice on the same report must return 200 both times.
    ${headers}=    Admin Auth Header
    ${resp}=    GET On Session    api    ${REPORTS_PATH}    headers=${headers}
    ${reports}=    Set Variable    ${resp.json()}
    ${approved_id}=    Set Variable    ${None}
    FOR    ${r}    IN    @{reports}
        IF    $r['approved']
            ${approved_id}=    Set Variable    ${r}[id]
            BREAK
        END
    END
    Skip If    $approved_id is None    No approved reports to test idempotency
    ${body}=    Create Dictionary
    ${resp}=    POST On Session    api    ${REPORTS_PATH}${approved_id}/approve
    ...    json=${body}    headers=${headers}
    Response Should Be OK    ${resp}

Export Reports As Admin Returns Excel File
    [Tags]    damaged-reports    smoke
    ${headers}=    Admin Auth Header
    ${resp}=    GET On Session    api    ${REPORTS_PATH}export    headers=${headers}
    Response Should Be OK    ${resp}
    Should Contain    ${resp.headers}[Content-Type]
    ...    application/vnd.openxmlformats-officedocument.spreadsheetml.sheet

Export Reports Without Auth Returns 401
    [Tags]    damaged-reports    negative
    ${resp}=    GET On Session    api    ${REPORTS_PATH}export    expected_status=401
    Response Should Be Unauthorized    ${resp}

*** Variables ***
${EMPTY LIST}    @{[]}
