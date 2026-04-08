*** Settings ***
Documentation
...    System tests for:
...      GET  /api/sessions/           (admin)
...      GET  /api/sessions/images     (admin)
...      POST /api/sessions/{id}/close-image (ESP32-CAM, no auth required)
Resource          ../resources/common.resource
Resource          ../resources/auth.resource

Suite Setup       Create API Session
Suite Teardown    Delete API Session

*** Variables ***
${SESSIONS_PATH}    /api/sessions/

*** Test Cases ***

List Sessions Without Auth Returns 403
    [Tags]    sessions    negative
    [Documentation]    FastAPI HTTPBearer returns 403 when no Authorization header is present.
    ${resp}=    GET On Session    api    ${SESSIONS_PATH}    expected_status=403
    Response Should Be Forbidden    ${resp}

List Sessions As Admin Returns Paginated Response
    [Tags]    sessions    smoke
    ${headers}=    Admin Auth Header
    ${resp}=    GET On Session    api    ${SESSIONS_PATH}    headers=${headers}
    Response Should Be OK    ${resp}
    ${json}=    Set Variable    ${resp.json()}
    Dictionary Should Contain Key    ${json}    sessions
    Dictionary Should Contain Key    ${json}    total
    Dictionary Should Contain Key    ${json}    page
    Dictionary Should Contain Key    ${json}    page_size
    Dictionary Should Contain Key    ${json}    total_pages

List Sessions Default Page Is 1
    [Tags]    sessions
    ${headers}=    Admin Auth Header
    ${resp}=    GET On Session    api    ${SESSIONS_PATH}    headers=${headers}
    Should Be Equal As Integers    ${resp.json()}[page]    1

List Sessions Custom Page Size Respected
    [Tags]    sessions
    ${headers}=    Admin Auth Header
    ${params}=    Create Dictionary    page=1    page_size=5
    ${resp}=    GET On Session    api    ${SESSIONS_PATH}    headers=${headers}    params=${params}
    Response Should Be OK    ${resp}
    Should Be Equal As Integers    ${resp.json()}[page_size]    5

List Session Images Without Auth Returns 403
    [Tags]    sessions    negative
    [Documentation]    FastAPI HTTPBearer returns 403 when no Authorization header is present.
    ${resp}=    GET On Session    api    ${SESSIONS_PATH}images    expected_status=403
    Response Should Be Forbidden    ${resp}

List Session Images As Admin Returns Paginated Response
    [Tags]    sessions    smoke
    ${headers}=    Admin Auth Header
    ${resp}=    GET On Session    api    ${SESSIONS_PATH}images    headers=${headers}
    Response Should Be OK    ${resp}
    ${json}=    Set Variable    ${resp.json()}
    Dictionary Should Contain Key    ${json}    images
    Dictionary Should Contain Key    ${json}    total
    Dictionary Should Contain Key    ${json}    total_pages

Close Image With Empty Body Returns 400
    [Tags]    sessions    negative
    [Documentation]
    ...    The ESP32-CAM posts raw JPEG bytes. An empty body must return 400.
    ${headers}=    Create Dictionary    Content-Type=image/jpeg
    ${resp}=    POST On Session    api    ${SESSIONS_PATH}999999/close-image
    ...    data=${EMPTY}    headers=${headers}    expected_status=400
    Response Should Be Bad Request    ${resp}

Close Image For Non-Existent Session Returns 404
    [Tags]    sessions    negative
    [Documentation]
    ...    A valid (non-empty) JPEG body against an unknown session_id → 404.
    # Minimal valid payload — just a non-empty byte sequence
    ${fake_jpeg}=    Convert To Bytes    \xFF\xD8\xFF\xD9
    ${headers}=    Create Dictionary    Content-Type=image/jpeg
    ${resp}=    POST On Session    api    ${SESSIONS_PATH}999999/close-image
    ...    data=${fake_jpeg}    headers=${headers}    expected_status=404
    Response Should Be Not Found    ${resp}
