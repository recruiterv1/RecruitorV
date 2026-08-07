package com.recruiterv.app;

import android.os.Bundle;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        lockTextZoom();
    }

    @Override
    public void onResume() {
        super.onResume();
        // Re-apply in case the WebView re-reads system settings on resume.
        lockTextZoom();
    }

    // Ignore the device's system font-size / display-size setting so the
    // responsive layout is never scaled up and clipped (cards cut off).
    private void lockTextZoom() {
        try {
            WebView webView = getBridge().getWebView();
            if (webView != null) {
                webView.getSettings().setTextZoom(100);
            }
        } catch (Exception ignored) {
        }
    }
}
