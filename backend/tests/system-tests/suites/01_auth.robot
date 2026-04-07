*** Settings ***
Documentation     System tests for POST /api/auth/login and GET /api/auth/me
Resource          ../resources/common.resource
Resource          ../resources/auth.resource

Suite Setup       Create API Session
Suite Teardown    Delete API Session

*** Test Cases ***

Login With Valid Admin Credentials Returns Token And User
    [Tags]    auth    smoke
    ${body}=    Create Dictionary
    ...    email=${ADMIN_EMAIL}
    ...    password=${ADMIN_PASSWORD}
    ${resp}=    POST On Session    api    /api/auth/login    json=${body}
    Response Should Be OK    ${resp}
    ${json}=    Set Variable    ${resp.json()}
    Dictionary Should Contain Key    ${json}    access_token
    Dictionary Should Contain Key    ${json}    user
    Should Be Equal    ${json}[user][email]    ${ADMIN_EMAIL}
    Should Be Equal    ${json}[token_type]    bearer

Login With Wrong Password Returns 401
    [Tags]    auth    negative
    ${body}=    Create Dictionary
    ...    email=${ADMIN_EMAIL}
    ...    password=wrongpassword
    ${resp}=    POST On Session    api    /api/auth/login
    ...    json=${body}    expected_status=401
    Response Should Be Unauthorized    ${resp}

Login With Unknown Email Returns 401
    [Tags]    auth    negative
    ${body}=    Create Dictionary
    ...    email=nobody@nowhere.com
    ...    password=whatever
    ${resp}=    POST On Session    api    /api/auth/login
    ...    json=${body}    expected_status=401
    Response Should Be Unauthorized    ${resp}

Login With Missing Password Field Returns 422
    [Tags]    auth    negative
    ${body}=    Create Dictionary    email=${ADMIN_EMAIL}
    ${resp}=    POST On Session    api    /api/auth/login
    ...    json=${body}    expected_status=422
    Should Be Equal As Integers    ${resp.status_code}    422

Get Me With Valid Token Returns Current User
    [Tags]    auth    smoke
    ${headers}=    Admin Auth Header
    ${resp}=    GET On Session    api    /api/auth/me    headers=${headers}
    Response Should Be OK    ${resp}
    ${json}=    Set Variable    ${resp.json()}
    Should Be Equal    ${json}[email]    ${ADMIN_EMAIL}
    Dictionary Should Contain Key    ${json}    id
    Dictionary Should Contain Key    ${json}    role

Get Me Without Token Returns 401
    [Tags]    auth    negative
    ${resp}=    GET On Session    api    /api/auth/me    expected_status=401
    Response Should Be Unauthorized    ${resp}

Get Me With Invalid Token Returns 401
    [Tags]    auth    negative
    ${headers}=    Create Dictionary    Authorization=Bearer not.a.real.token
    ${resp}=    GET On Session    api    /api/auth/me
    ...    headers=${headers}    expected_status=401
    Response Should Be Unauthorized    ${resp}
