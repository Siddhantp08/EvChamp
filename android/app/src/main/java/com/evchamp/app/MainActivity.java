package com.evchamp.app;

import android.app.AlertDialog;
import android.content.Context;
import android.graphics.Color;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.NetworkRequest;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private SwipeRefreshLayout swipeRefreshLayout;
    private ProgressBar topProgressBar;
    private LinearLayout offlineView;
    private WebView webView;
    private ConnectivityManager.NetworkCallback networkCallback;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        webView = getBridge().getWebView();
        if (webView == null) return;

        // --- WebView Settings ---
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setLoadsImagesAutomatically(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        // Remove ";wv" so Clerk does not block WebView user agent
        settings.setUserAgentString(settings.getUserAgentString().replace("; wv", ""));

        // Allow cookies (required for Clerk session)
        android.webkit.CookieManager.getInstance().setAcceptCookie(true);
        android.webkit.CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);

        // --- WebViewClient: handle navigation + loading states ---
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();
                // Keep clerk, evchamp, zeflash URLs inside the app
                if (url.contains("clerk") || url.contains("evchamp") || url.contains("zeflash")) {
                    view.loadUrl(url);
                    return true;
                }
                return false;
            }

            @Override
            public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
                if (topProgressBar != null) {
                    topProgressBar.setVisibility(View.VISIBLE);
                    topProgressBar.setProgress(0);
                }
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                if (topProgressBar != null) {
                    topProgressBar.setProgress(100);
                    topProgressBar.setVisibility(View.GONE);
                }
                if (swipeRefreshLayout != null) {
                    swipeRefreshLayout.setRefreshing(false);
                }
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, android.webkit.WebResourceError error) {
                super.onReceivedError(view, request, error);
                if (request.isForMainFrame() && !isNetworkAvailable()) {
                    runOnUiThread(() -> showOfflineView());
                }
            }
        });

        // --- WebChromeClient: track load progress ---
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                super.onProgressChanged(view, newProgress);
                if (topProgressBar != null) {
                    topProgressBar.setProgress(newProgress);
                    topProgressBar.setVisibility(newProgress < 100 ? View.VISIBLE : View.GONE);
                }
            }
        });

        // --- Wrap WebView in SwipeRefreshLayout ---
        ViewGroup parent = (ViewGroup) webView.getParent();
        if (parent != null) {
            int index = parent.indexOfChild(webView);
            parent.removeView(webView);

            // Root frame
            FrameLayout rootFrame = new FrameLayout(this);
            rootFrame.setLayoutParams(new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT));

            // SwipeRefreshLayout
            swipeRefreshLayout = new SwipeRefreshLayout(this);
            swipeRefreshLayout.setLayoutParams(new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT));
            swipeRefreshLayout.setColorSchemeResources(android.R.color.holo_green_dark);
            swipeRefreshLayout.addView(webView);
            swipeRefreshLayout.setOnRefreshListener(() -> {
                if (isNetworkAvailable()) {
                    hideOfflineView();
                    webView.reload();
                } else {
                    swipeRefreshLayout.setRefreshing(false);
                    showOfflineView();
                }
            });

            // Top progress bar
            topProgressBar = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
            FrameLayout.LayoutParams pbParams = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, 8);
            pbParams.gravity = Gravity.TOP;
            topProgressBar.setLayoutParams(pbParams);
            topProgressBar.setMax(100);
            topProgressBar.setProgressTintList(
                android.content.res.ColorStateList.valueOf(Color.parseColor("#22C55E")));
            topProgressBar.setVisibility(View.GONE);

            // Offline view
            offlineView = buildOfflineView();
            offlineView.setVisibility(View.GONE);

            rootFrame.addView(swipeRefreshLayout);
            rootFrame.addView(topProgressBar);
            rootFrame.addView(offlineView);

            parent.addView(rootFrame, index);
        }

        // --- Network monitoring ---
        ConnectivityManager cm = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
        networkCallback = new ConnectivityManager.NetworkCallback() {
            @Override
            public void onAvailable(Network network) {
                runOnUiThread(() -> {
                    hideOfflineView();
                    if (webView != null) webView.reload();
                });
            }

            @Override
            public void onLost(Network network) {
                runOnUiThread(() -> showOfflineView());
            }
        };
        NetworkRequest request = new NetworkRequest.Builder()
            .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
            .build();
        cm.registerNetworkCallback(request, networkCallback);

        // Show offline immediately if no network at start
        if (!isNetworkAvailable()) {
            showOfflineView();
        }
    }

    private LinearLayout buildOfflineView() {
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setGravity(Gravity.CENTER);
        layout.setBackgroundColor(Color.WHITE);
        FrameLayout.LayoutParams lp = new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT);
        layout.setLayoutParams(lp);
        layout.setPadding(64, 64, 64, 64);

        TextView emoji = new TextView(this);
        emoji.setText("📶");
        emoji.setTextSize(48f);
        emoji.setGravity(Gravity.CENTER);

        TextView title = new TextView(this);
        title.setText("No Internet Connection");
        title.setTextSize(20f);
        title.setTextColor(Color.parseColor("#111827"));
        title.setGravity(Gravity.CENTER);
        title.setPadding(0, 24, 0, 8);
        title.setTypeface(null, android.graphics.Typeface.BOLD);

        TextView subtitle = new TextView(this);
        subtitle.setText("Please check your connection and try again.");
        subtitle.setTextSize(14f);
        subtitle.setTextColor(Color.parseColor("#6B7280"));
        subtitle.setGravity(Gravity.CENTER);
        subtitle.setPadding(0, 0, 0, 40);

        Button retryBtn = new Button(this);
        retryBtn.setText("Retry");
        retryBtn.setTextColor(Color.WHITE);
        retryBtn.setBackgroundColor(Color.parseColor("#22C55E"));
        retryBtn.setPadding(80, 24, 80, 24);
        retryBtn.setOnClickListener(v -> {
            if (isNetworkAvailable()) {
                hideOfflineView();
                if (webView != null) webView.reload();
            }
        });

        layout.addView(emoji);
        layout.addView(title);
        layout.addView(subtitle);
        layout.addView(retryBtn);

        return layout;
    }

    private boolean isNetworkAvailable() {
        ConnectivityManager cm = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
        if (cm == null) return false;
        Network net = cm.getActiveNetwork();
        if (net == null) return false;
        NetworkCapabilities caps = cm.getNetworkCapabilities(net);
        return caps != null && caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET);
    }

    private void showOfflineView() {
        if (offlineView != null) offlineView.setVisibility(View.VISIBLE);
        if (topProgressBar != null) topProgressBar.setVisibility(View.GONE);
        if (swipeRefreshLayout != null) swipeRefreshLayout.setRefreshing(false);
    }

    private void hideOfflineView() {
        if (offlineView != null) offlineView.setVisibility(View.GONE);
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
            return;
        }

        new AlertDialog.Builder(this)
            .setTitle("Exit EVChamp")
            .setMessage("Do you want to exit the app?")
            .setPositiveButton("Exit", (dialog, which) -> finishAffinity())
            .setNegativeButton("Cancel", (dialog, which) -> dialog.dismiss())
            .setCancelable(true)
            .show();
    }
}

