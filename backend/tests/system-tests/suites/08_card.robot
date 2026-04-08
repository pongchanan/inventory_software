*** Settings ***
Documentation
...    System tests for the "Link/Unlink NFC Card" use case (included by Register Account).
...
...    Endpoints:
...      POST /api/users/me/link-card   — tell IoT to scan a card and link it to current user
...      POST /api/users/me/unlink-card — remove the linked card from current user
...
...    Note: link-card waits for a real IoT hardware scan (15s timeout).
...    The hardware-dependent path is covered by negative cases only
...    (no hardware, 408 timeout or 409 already-linked) so these tests
...    never require a physical kiosk to be present.
Resource          ../resources/common.resource
Resource          ../resources/auth.resource

Suite Setup       Create API Session
Suite Teardown    Delete API Session

*** Variables ***
${CARD_BASE}    /api/users/me

*** Test Cases ***

# ---------------------------------------------------------------------------
# Auth guards — no token → 403
# ---------------------------------------------------------------------------

Link Card Without Auth Returns 403
    [Tags]    nfc-card    negative
    [Documentation]    FastAPI HTTPBearer returns 403 when no Authorization header is present.
    ${resp}=    POST On Session    api    ${CARD_BASE}/link-card    expected_status=403
    Response Should Be Forbidden    ${resp}

Unlink Card Without Auth Returns 403
    [Tags]    nfc-card    negative
    [Documentation]    FastAPI HTTPBearer returns 403 when no Authorization header is present.
    ${resp}=    POST On Session    api    ${CARD_BASE}/unlink-card    expected_status=403
    Response Should Be Forbidden    ${resp}

# ---------------------------------------------------------------------------
# Unlink card — testable without hardware
# ---------------------------------------------------------------------------

Unlink Card When No Card Is Linked Returns 400
    [Tags]    nfc-card    negative
    [Documentation]
    ...    Admin account has no card linked by default.
    ...    Calling unlink must return 400 "No card linked to unlink".
    ${headers}=    Admin Auth Header
    # Check if admin already has a card linked; skip if they do
    ${me}=    GET On Session    api    /api/auth/me    headers=${headers}
    ${has_card}=    Set Variable    ${me.json()}[card_id]
    Skip If    $has_card is not None    Admin already has a card linked — skip no-card test
    ${resp}=    POST On Session    api    ${CARD_BASE}/unlink-card
    ...    headers=${headers}    expected_status=400
    Response Should Be Bad Request    ${resp}
    Should Contain    ${resp.json()}[detail]    No card linked

Unlink Card When Card Is Linked Returns 200 And Clears Card Id
    [Tags]    nfc-card
    [Documentation]
    ...    If the admin account already has a card linked, unlinking must
    ...    return 200 and set card_id to null in the response.
    ${headers}=    Admin Auth Header
    ${me}=    GET On Session    api    /api/auth/me    headers=${headers}
    ${has_card}=    Set Variable    ${me.json()}[card_id]
    Skip If    $has_card is None    Admin has no card linked — skip unlink success test
    ${resp}=    POST On Session    api    ${CARD_BASE}/unlink-card
    ...    headers=${headers}    expected_status=200
    Response Should Be OK    ${resp}
    ${card_after}=    Set Variable    ${resp.json()}[card_id]
    Should Be Equal    ${card_after}    ${None}

# ---------------------------------------------------------------------------
# Link card — hardware-dependent paths (expected failures without kiosk)
# ---------------------------------------------------------------------------

Link Card When Already Linked Returns 409
    [Tags]    nfc-card    negative
    [Documentation]
    ...    If the admin already has a card, a second link attempt returns 409
    ...    immediately without waiting for IoT.
    ${headers}=    Admin Auth Header
    ${me}=    GET On Session    api    /api/auth/me    headers=${headers}
    ${has_card}=    Set Variable    ${me.json()}[card_id]
    Skip If    $has_card is None    Admin has no card — need a linked card to test 409
    ${resp}=    POST On Session    api    ${CARD_BASE}/link-card
    ...    headers=${headers}    expected_status=409
    Should Be Equal As Integers    ${resp.status_code}    409
    Should Contain    ${resp.json()}[detail]    already have a card

Link Card Without Hardware Times Out And Returns 408
    [Tags]    nfc-card    negative    slow
    [Documentation]
    ...    When no IoT kiosk is connected the backend waits 15 seconds and then
    ...    returns 408 Request Timeout.  This test is tagged "slow" and is
    ...    excluded from the default smoke run.
    ...    Run explicitly: robot --include slow suites/08_card.robot
    ${headers}=    Admin Auth Header
    ${me}=    GET On Session    api    /api/auth/me    headers=${headers}
    ${has_card}=    Set Variable    ${me.json()}[card_id]
    Skip If    $has_card is not None    Admin already has a card — would get 409 not 408
    ${resp}=    POST On Session    api    ${CARD_BASE}/link-card
    ...    headers=${headers}    expected_status=408    timeout=20
    Should Be Equal As Integers    ${resp.status_code}    408
    Should Contain    ${resp.json()}[detail]    timed out
