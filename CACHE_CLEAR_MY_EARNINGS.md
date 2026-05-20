# 🔄 Cache Clear Instructions for My Earnings Feature

## ⚠️ IMPORTANT: Clear Your Browser Cache

The "My Earnings" menu item may not appear immediately due to browser caching. Follow these steps:

## Quick Cache Clear (Recommended)

### For All Browsers:
**Press:** `Ctrl + Shift + R` (Windows/Linux) or `Cmd + Shift + R` (Mac)

This performs a "hard refresh" and clears the cache for the current page.

---

## Complete Cache Clear (If Hard Refresh Doesn't Work)

### Google Chrome:
1. Press `Ctrl + Shift + Delete` (Windows) or `Cmd + Shift + Delete` (Mac)
2. Select "All time" from the time range dropdown
3. Check "Cached images and files"
4. Click "Clear data"
5. Refresh the page

### Firefox:
1. Press `Ctrl + Shift + Delete` (Windows) or `Cmd + Shift + Delete` (Mac)
2. Select "Everything" from the time range
3. Check "Cache"
4. Click "Clear Now"
5. Refresh the page

### Safari:
1. Go to Safari > Preferences > Advanced
2. Check "Show Develop menu in menu bar"
3. Click Develop > Empty Caches
4. Refresh the page

### Microsoft Edge:
1. Press `Ctrl + Shift + Delete`
2. Select "All time"
3. Check "Cached images and files"
4. Click "Clear now"
5. Refresh the page

---

## Verify the Menu Appears

After clearing cache:

1. **Login** to your recruiter account
2. Look at the **left sidebar**
3. You should see **"My Earnings"** with a 💰 (dollar sign) icon
4. It appears between "Candidates" and "My Access Requests" (for free users)

---

## Still Not Seeing It?

### Try These Steps:

1. **Logout and Login Again**
   - Click logout
   - Clear cache again
   - Login fresh

2. **Try Incognito/Private Mode**
   - Open a new incognito/private window
   - Login to your account
   - Check if menu appears

3. **Check Different Browser**
   - Try Chrome, Firefox, or Edge
   - Sometimes one browser caches more aggressively

4. **Wait 5-10 Minutes**
   - Firebase hosting can take a few minutes to propagate
   - Try again after a short wait

---

## Direct URL Access

If the menu still doesn't appear, try accessing directly:

```
https://recruitorv-1291c.web.app/my-earnings
```

Or for local development:
```
http://localhost:5173/my-earnings
```

---

## Troubleshooting

### Menu Still Not Visible?

1. **Check Browser Console** (F12)
   - Look for any JavaScript errors
   - Check if files are loading correctly

2. **Verify Deployment**
   - Check Firebase Console
   - Confirm hosting deployment succeeded

3. **Check User Role**
   - Ensure you're logged in as a recruiter
   - The menu is only for recruiter accounts

---

## Contact Support

If none of these steps work:
1. Take a screenshot of your sidebar
2. Check browser console for errors (F12)
3. Note your browser and version
4. Contact technical support

---

**Remember:** Browser caching is the #1 reason for not seeing new features immediately!

**Always try a hard refresh first:** `Ctrl + Shift + R` or `Cmd + Shift + R`
