# IBL Planer v2.0 — Acceptance Tests

## Test 1: Authentication
- Navigate to /chat → redirected to /login ✓
- Enter wrong PIN → error message shown ✓
- Enter correct PIN → redirected to /chat ✓
- Session persists on page refresh ✓

## Test 2: Plan Generation (Bosnian)
Input: "Matematika, 5. razred, Razlomci, 90 minuta"
Expected:
- [ ] Istraživačko pitanje generated (open-ended, Wiggins-McTighe)
- [ ] All 10 sections present in output
- [ ] Plain text format (no HTML, no Markdown)
- [ ] Plan auto-saved to Supabase
- [ ] Plan appears in Dashboard

## Test 3: Plan Generation (German)
Input: "Deutsch, 7, Kurzgeschichten, 45"
Expected:
- [ ] Forschungsfrage generated
- [ ] Output in German language throughout
- [ ] MICRO tier applied (45 min)

## Test 4: DOCX Export
- Open any generated plan
- Click "Izvoz u Word"
- [ ] .docx file downloads
- [ ] File opens in Word/LibreOffice
- [ ] IDSS header present
- [ ] Inquiry question callout visible
- [ ] Plan text in monospace font

## Test 5: Post-generation Chat
After generating a plan:
- Ask: "Kako mogu poboljšati udicu?"
- [ ] AI responds with specific suggestions for THAT plan
- [ ] Suggested questions appear below chat

## Test 6: Dashboard
- [ ] All generated plans visible
- [ ] Filter by subject works
- [ ] Filter by grade works
- [ ] Search works
- [ ] Favourite toggle works
- [ ] Click on card opens plan detail

## Test 7: Gemini Key Rotation
- With only GEMINI_KEY_1 set (others empty)
- [ ] App still works (falls back gracefully)
- [ ] No crash on generation

## Test 8: Session Expiry
- Wait 8 hours OR manually delete pin_session cookie
- [ ] Next request redirects to /login
- [ ] After re-login, app works normally