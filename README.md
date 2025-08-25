Installation in Chrome:
1. Download the project folder.
   - Make sure you have all the files:
     * manifest.json
     * content_script.js
     * utils.js
     * ui.css
     * (and any other related files).

2. Open Chrome Extensions page.
   - In Google Chrome, go to the URL bar and type:
     chrome://extensions/
   - Press Enter.
   - This opens the extensions management page.

3. Enable Developer Mode.
   - On the top-right corner, toggle Developer Mode to ON.
   - Three new buttons will appear: Load unpacked, Pack extension, and Update.

4. Load the Extension.
   - Click Load unpacked.
   - A file picker window will open.
   - Navigate to the project folder (the one containing manifest.json) and select it.
   - Chrome will load the extension immediately.
   - You should now see Password Checker in your list of installed extensions.

---------------------------------------------------
Using the Extension:
1. Go to any website with a password field.
   - For example: Gmail signup, Twitter signup/login, or any form asking for a password.

2. Start typing a password.
   - A small popup box will appear just below the password field.
   - The box shows:
     * Password Strength -> Weak / Okay / Strong (with a colored bar).
     * Breach Check -> Tells if your password was found in leaked databases.
     * Improvement Tips -> Suggestions like "Add uppercase" or "Use 12+ characters."
     * Password Suggestions -> 3 strong alternatives you can directly use.

3. Swap to a Stronger Password.
   - Next to each suggestion, there’s a Swap button.
   - Click it -> Your typed password will be replaced by that strong suggestion.

4. Regenerate Suggestions.
   - If you want new ideas, click the Regenerate Suggestions button.
   - The extension will create fresh strong passwords.

5. Focus & Blur Behavior.
   - The popup appears when you type in a password field.
   - It disappears when you click outside or move to another field.

---------------------------------------------------
Privacy Notes:
- The extension never sends your full password anywhere.
- It only sends the first 5 characters of the SHA-1 hash to the Have I Been Pwned (HIBP) API.
- This ensures your actual password remains private.

