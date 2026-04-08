*** Settings ***
Library    RequestsLibrary
Library    Collections
Library    JSONLibrary

*** Variables ***
${BASE_URL}         http://localhost:3000
${ADMIN_EMAIL}      testadmin@gmail.com
${ADMIN_PASSWORD}   admin123
${CONTENT_JSON}     application/json

*** Keywords ***
Create API Session
    [Documentation]    Create a base RequestsLibrary session pointing at the backend.
    Create Session    api    ${BASE_URL}    verify=false

Delete API Session
    [Documentation]    Clean up the shared session.
    Delete All Sessions

Response Should Be OK
    [Arguments]    ${response}
    Should Be Equal As Integers    ${response.status_code}    200

Response Should Be Created
    [Arguments]    ${response}
    Should Be Equal As Integers    ${response.status_code}    201

Response Should Be Unauthorized
    [Arguments]    ${response}
    Should Be Equal As Integers    ${response.status_code}    401

Response Should Be Forbidden
    [Arguments]    ${response}
    Should Be Equal As Integers    ${response.status_code}    403

Response Should Be Not Found
    [Arguments]    ${response}
    Should Be Equal As Integers    ${response.status_code}    404

Response Should Be Bad Request
    [Arguments]    ${response}
    Should Be Equal As Integers    ${response.status_code}    400

Response JSON Has Key
    [Arguments]    ${response}    ${key}
    ${body}=    Set Variable    ${response.json()}
    Dictionary Should Contain Key    ${body}    ${key}

Response JSON Key Equals
    [Arguments]    ${response}    ${key}    ${expected}
    ${body}=    Set Variable    ${response.json()}
    Should Be Equal    ${body}[${key}]    ${expected}
