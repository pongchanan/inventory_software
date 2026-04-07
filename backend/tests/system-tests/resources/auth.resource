*** Settings ***
Library    RequestsLibrary
Library    Collections
Resource   common.resource

*** Keywords ***
Get Admin Token
    [Documentation]
    ...    POST /api/auth/login with admin credentials.
    ...    Returns the raw JWT string.
    ${body}=    Create Dictionary
    ...    email=${ADMIN_EMAIL}
    ...    password=${ADMIN_PASSWORD}
    ${resp}=    POST On Session    api    /api/auth/login    json=${body}    expected_status=200
    ${token}=    Set Variable    ${resp.json()}[access_token]
    RETURN    ${token}

Admin Auth Header
    [Documentation]    Returns a headers dict with Authorization: Bearer <admin token>.
    ${token}=    Get Admin Token
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    RETURN    ${headers}

Get User Token
    [Arguments]    ${email}    ${password}
    [Documentation]    POST /api/auth/login with given credentials and return JWT.
    ${body}=    Create Dictionary    email=${email}    password=${password}
    ${resp}=    POST On Session    api    /api/auth/login    json=${body}    expected_status=200
    ${token}=    Set Variable    ${resp.json()}[access_token]
    RETURN    ${token}

User Auth Header
    [Arguments]    ${email}    ${password}
    [Documentation]    Returns a headers dict for a generic user.
    ${token}=    Get User Token    ${email}    ${password}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    RETURN    ${headers}
