package com.nfckeycard.app

import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.nfckeycard.app.databinding.ActivitySettingsBinding

class SettingsActivity : AppCompatActivity() {

    private lateinit var binding: ActivitySettingsBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivitySettingsBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.settingsToolbar.setNavigationOnClickListener { finish() }

        binding.endpointInput.setText(Prefs.getEndpoint(this).orEmpty())
        binding.apiKeyInput.setText(Prefs.getApiKey(this).orEmpty())

        binding.saveButton.setOnClickListener {
            val endpoint = binding.endpointInput.text.toString().trim()
            val apiKey = binding.apiKeyInput.text.toString().trim()
            Prefs.save(this, endpoint, apiKey)
            Toast.makeText(this, R.string.settings_saved, Toast.LENGTH_SHORT).show()
            finish()
        }
    }
}
