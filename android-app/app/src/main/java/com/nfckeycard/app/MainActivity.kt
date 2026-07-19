package com.nfckeycard.app

import android.app.PendingIntent
import android.content.Intent
import android.content.IntentFilter
import android.nfc.NfcAdapter
import android.nfc.Tag
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.view.Menu
import android.view.MenuItem
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.google.android.material.snackbar.Snackbar
import com.nfckeycard.app.databinding.ActivityMainBinding

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private var nfcAdapter: NfcAdapter? = null
    private var pendingIntent: PendingIntent? = null
    private var isBusy = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
        setSupportActionBar(binding.toolbar)

        nfcAdapter = NfcAdapter.getDefaultAdapter(this)

        val intent = Intent(this, javaClass).apply {
            addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP)
        }
        val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PendingIntent.FLAG_MUTABLE
        } else {
            0
        }
        pendingIntent = PendingIntent.getActivity(this, 0, intent, flags)

        binding.openDoorButton.setOnClickListener { onOpenDoorClicked() }

        showIdleState()
        handleIntent(getIntent())
    }

    override fun onCreateOptionsMenu(menu: Menu): Boolean {
        menuInflater.inflate(R.menu.main_menu, menu)
        return true
    }

    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        if (item.itemId == R.id.action_settings) {
            startActivity(Intent(this, SettingsActivity::class.java))
            return true
        }
        return super.onOptionsItemSelected(item)
    }

    override fun onResume() {
        super.onResume()
        val adapter = nfcAdapter
        if (adapter != null && adapter.isEnabled) {
            val filters = arrayOf(IntentFilter(NfcAdapter.ACTION_TECH_DISCOVERED))
            val techLists = arrayOf(
                arrayOf(android.nfc.tech.NfcA::class.java.name),
                arrayOf(android.nfc.tech.NfcB::class.java.name),
                arrayOf(android.nfc.tech.NfcF::class.java.name),
                arrayOf(android.nfc.tech.NfcV::class.java.name),
                arrayOf(android.nfc.tech.MifareClassic::class.java.name),
                arrayOf(android.nfc.tech.MifareUltralight::class.java.name),
                arrayOf(android.nfc.tech.IsoDep::class.java.name)
            )
            adapter.enableForegroundDispatch(this, pendingIntent, filters, techLists)
        }
        refreshHint()
    }

    override fun onPause() {
        super.onPause()
        nfcAdapter?.disableForegroundDispatch(this)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleIntent(intent)
    }

    private fun handleIntent(intent: Intent?) {
        if (intent == null) return
        if (intent.action != NfcAdapter.ACTION_TECH_DISCOVERED &&
            intent.action != NfcAdapter.ACTION_TAG_DISCOVERED &&
            intent.action != NfcAdapter.ACTION_NDEF_DISCOVERED
        ) {
            return
        }

        @Suppress("DEPRECATION")
        val tag: Tag = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            intent.getParcelableExtra(NfcAdapter.EXTRA_TAG, Tag::class.java)
        } else {
            intent.getParcelableExtra(NfcAdapter.EXTRA_TAG)
        } ?: return

        onCardScanned(tag)
    }

    private fun onCardScanned(tag: Tag) {
        if (isBusy) return

        val cardId = tag.id.joinToString(separator = "") { byte -> "%02X".format(byte) }
        binding.cardIdText.visibility = android.view.View.VISIBLE
        binding.cardIdText.text = getString(R.string.card_id_label, cardId)

        val endpoint = Prefs.getEndpoint(this)
        if (endpoint.isNullOrBlank()) {
            showState(getString(R.string.status_no_endpoint), R.color.status_error_bg, R.color.status_on_color_text)
            return
        }

        val apiKey = Prefs.getApiKey(this)
        isBusy = true
        showScanningState()

        AccessApiClient.verifyAccess(endpoint, apiKey, cardId) { result ->
            isBusy = false
            binding.progressBar.visibility = android.view.View.GONE
            result.fold(
                onSuccess = { access ->
                    if (access.granted) {
                        showState(
                            access.message?.takeIf { it.isNotBlank() } ?: getString(R.string.status_granted),
                            R.color.status_granted_bg,
                            R.color.status_on_color_text
                        )
                    } else {
                        showState(
                            access.message?.takeIf { it.isNotBlank() } ?: getString(R.string.status_denied),
                            R.color.status_denied_bg,
                            R.color.status_on_color_text
                        )
                    }
                },
                onFailure = { error ->
                    showState(
                        getString(R.string.status_error, error.message ?: error.toString()),
                        R.color.status_error_bg,
                        R.color.status_on_color_text
                    )
                }
            )
        }
    }

    private fun onOpenDoorClicked() {
        if (isBusy) return

        val endpoint = Prefs.getOpenDoorEndpoint(this)
        if (endpoint.isNullOrBlank()) {
            binding.cardIdText.visibility = android.view.View.GONE
            showState(getString(R.string.status_no_open_door_endpoint), R.color.status_error_bg, R.color.status_on_color_text)
            return
        }

        val apiKey = Prefs.getApiKey(this)
        isBusy = true
        binding.cardIdText.visibility = android.view.View.GONE
        binding.progressBar.visibility = android.view.View.VISIBLE
        showState(getString(R.string.status_opening_door), R.color.status_idle_bg, R.color.status_idle_text)

        AccessApiClient.openDoor(endpoint, apiKey) { result ->
            isBusy = false
            binding.progressBar.visibility = android.view.View.GONE
            result.fold(
                onSuccess = { access ->
                    if (access.granted) {
                        showState(
                            access.message?.takeIf { it.isNotBlank() } ?: getString(R.string.status_door_opened),
                            R.color.status_granted_bg,
                            R.color.status_on_color_text
                        )
                    } else {
                        showState(
                            access.message?.takeIf { it.isNotBlank() } ?: getString(R.string.status_door_failed),
                            R.color.status_denied_bg,
                            R.color.status_on_color_text
                        )
                    }
                },
                onFailure = { error ->
                    showState(
                        getString(R.string.status_error, error.message ?: error.toString()),
                        R.color.status_error_bg,
                        R.color.status_on_color_text
                    )
                }
            )
        }
    }

    private fun showScanningState() {
        binding.progressBar.visibility = android.view.View.VISIBLE
        showState(getString(R.string.status_scanning), R.color.status_idle_bg, R.color.status_idle_text)
    }

    private fun showIdleState() {
        binding.cardIdText.visibility = android.view.View.GONE
        showState(getString(R.string.status_idle), R.color.status_idle_bg, R.color.status_idle_text)
    }

    private fun showState(text: String, bgColorRes: Int, textColorRes: Int) {
        binding.statusText.text = text
        binding.statusText.setTextColor(getColor(textColorRes))
        binding.cardIdText.setTextColor(getColor(textColorRes))
        binding.statusCard.setCardBackgroundColor(getColor(bgColorRes))
    }

    private fun refreshHint() {
        val adapter = nfcAdapter
        binding.hintText.text = when {
            adapter == null -> getString(R.string.status_no_nfc)
            !adapter.isEnabled -> getString(R.string.status_nfc_disabled)
            Prefs.getEndpoint(this).isNullOrBlank() -> getString(R.string.status_no_endpoint)
            else -> ""
        }
        if (adapter != null && !adapter.isEnabled) {
            Snackbar.make(binding.root, R.string.status_nfc_disabled, Snackbar.LENGTH_LONG)
                .setAction(R.string.nfc_enable_settings) {
                    startActivity(Intent(Settings.ACTION_NFC_SETTINGS))
                }
                .show()
        }
        if (adapter == null) {
            Toast.makeText(this, R.string.status_no_nfc, Toast.LENGTH_LONG).show()
        }
    }
}
