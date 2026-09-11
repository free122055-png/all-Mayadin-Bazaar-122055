package com.almayadinbazar.app;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;
import com.onesignal.OneSignal;
import com.onesignal.debug.LogLevel;
import com.onesignal.Continue;
import java.util.ArrayList;
import java.util.List;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "AlMayadinDeepLink";
    private static final String ONESIGNAL_APP_ID = "d28392ee-2a0f-4f62-ba65-03fb3e0915ab";
    private static final int PERMISSION_REQUEST_CODE = 1010;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Process any cold-start Deep Link Intent
        handleDeepLinkIntent(getIntent());

        try {
            // Set LogLevel
            OneSignal.getDebug().setLogLevel(LogLevel.WARN);

            // Initialize OneSignal natively for all users who install the Android app
            OneSignal.initWithContext(this, ONESIGNAL_APP_ID);

            // Prompt users for notification permission on Android 13+
            OneSignal.getNotifications().requestPermission(true, Continue.none());

            // Handle Notification Clicks to route directly to Deep Link or Product Details
            OneSignal.getNotifications().addClickListener(event -> {
                try {
                    String deepLink = null;
                    if (event != null && event.getNotification() != null && event.getNotification().getAdditionalData() != null) {
                        org.json.JSONObject data = event.getNotification().getAdditionalData();
                        if (data.has("deep_link")) {
                            deepLink = data.optString("deep_link");
                        } else if (data.has("productId")) {
                            deepLink = "almayadinbazar://product/" + data.optString("productId");
                        }
                    }
                    if (deepLink != null && getBridge() != null && getBridge().getWebView() != null) {
                        final String finalLink = deepLink;
                        getBridge().getWebView().post(new Runnable() {
                            @Override
                            public void run() {
                                String js = "if (window.__handleNativeDeepLink) { window.__handleNativeDeepLink('" + finalLink.replace("'", "\\'") + "'); }";
                                getBridge().getWebView().evaluateJavascript(js, null);
                            }
                        });
                    }
                } catch (Exception ex) {
                    Log.w(TAG, "Notification click deep link error: " + ex.getMessage());
                }
            });
        } catch (Exception e) {
            e.printStackTrace();
        }

        // Request runtime permissions: Camera, Location, Notifications
        requestRequiredPermissions();
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleDeepLinkIntent(intent);
    }

    private void handleDeepLinkIntent(Intent intent) {
        if (intent == null) return;
        Uri data = intent.getData();
        if (data != null) {
            String uriString = data.toString();
            Log.d(TAG, "Native Deep Link Received: " + uriString);
            try {
                // If Bridge and WebView are ready, notify JavaScript directly
                if (getBridge() != null && getBridge().getWebView() != null) {
                    final String js = "if (window.__handleNativeDeepLink) { window.__handleNativeDeepLink('" + uriString.replace("'", "\\'") + "'); }";
                    getBridge().getWebView().post(new Runnable() {
                        @Override
                        public void run() {
                            getBridge().getWebView().evaluateJavascript(js, null);
                        }
                    });
                }
            } catch (Exception e) {
                Log.w(TAG, "Failed to dispatch deep link to WebView: " + e.getMessage());
            }
        }
    }

    private void requestRequiredPermissions() {
        try {
            List<String> permissionsNeeded = new ArrayList<>();

            // 1. Camera Permission
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
                permissionsNeeded.add(Manifest.permission.CAMERA);
            }

            // 2. Location Permissions
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                permissionsNeeded.add(Manifest.permission.ACCESS_FINE_LOCATION);
            }
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                permissionsNeeded.add(Manifest.permission.ACCESS_COARSE_LOCATION);
            }

            // 3. Notification Permission (Android 13+)
            if (Build.VERSION.SDK_INT >= 33) {
                if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                    permissionsNeeded.add(Manifest.permission.POST_NOTIFICATIONS);
                }
            }

            if (!permissionsNeeded.isEmpty()) {
                ActivityCompat.requestPermissions(this, permissionsNeeded.toArray(new String[0]), PERMISSION_REQUEST_CODE);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}

