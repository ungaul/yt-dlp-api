$(function () {
  // ===== STATE =====
  const LS_KEY = 'ytdlp_api_endpoint';
  const LS_COOKIES_KEY = 'ytdlp_cookies';
  let apiBase = localStorage.getItem(LS_KEY) || '';
  let currentDownloadController = null;

  // ===== DOM REFS =====
  const $modal = $('#endpoint-modal');
  const $epInput = $('#endpoint-input');
  const $epSave = $('#endpoint-save');
  const $app = $('#app');
  const $urlInput = $('#url-input');
  const $btnPaste = $('#btn-paste');
  const $btnClear = $('#btn-clear');
  const $btnInfo = $('#btn-info');
  const $btnFormats = $('#btn-formats');
  const $btnDownload = $('#btn-download');
  const $dlOptions = $('#download-options');
  const $btnStartDl = $('#btn-start-download');
  const $optFormat = $('#opt-format');
  const $optQuality = $('#opt-quality');
  const $cookieToggle = $('#opt-cookies-toggle');
  const $cookiesSec = $('#cookies-section');
  const $cookiesArea = $('#opt-cookies-content');
  const $cookiesValid = $('#cookies-validation');
  const $results = $('#results');
  const $loading = $('#loading');
  const $error = $('#error');
  const $errorMsg = $('#error-msg');
  const $infoResult = $('#info-result');
  const $infoThumb = $('#info-thumb');
  const $infoTable = $('#info-table');
  const $fmtResult = $('#formats-result');
  const $fmtTbody = $('#formats-table tbody');
  const $statusDot = $('#status-dot');
  const $statusText = $('#status-text');
  const $epDisplay = $('#endpoint-display');
  const $btnSettings = $('#btn-settings');
  const $dlProgress = $('#download-progress');
  const $dlIcon = $('#dl-icon');
  const $dlSpinner = $('#dl-spinner');
  const $dlTitle = $('#dl-title');
  const $dlSub = $('#dl-sub');
  const $dlBarFill = $('#dl-bar-fill');
  const $dlPercent = $('#dl-percent');
  const $dlSize = $('#dl-size');
  const $dlCancel = $('#dl-cancel');
  const $toasts = $('#toast-container');

  // ===== INIT =====
  const savedCookies = localStorage.getItem(LS_COOKIES_KEY) || '';
  if (savedCookies) $cookiesArea.val(savedCookies);

  if (apiBase) {
    showApp(true);
  } else {
    $modal.removeClass('hidden');
  }

  // ===== TOAST SYSTEM =====
  function toast(type, message, duration) {
    duration = duration || 5000;
    const icons = {
      error: 'alert-circle-outline',
      success: 'checkmark-circle-outline',
      info: 'information-circle-outline',
    };
    const $t = $('<div class="toast toast-' + type + '">' +
      '<ion-icon name="' + icons[type] + '"></ion-icon>' +
      '<span class="toast-message">' + escapeHtml(message) + '</span>' +
      '<button class="toast-dismiss"><ion-icon name="close-outline"></ion-icon></button>' +
      '</div>');

    $toasts.append($t);

    const dismiss = function () {
      $t.addClass('toast-out');
      setTimeout(function () { $t.remove(); }, 250);
    };

    $t.find('.toast-dismiss').on('click', dismiss);
    if (duration > 0) setTimeout(dismiss, duration);

    return $t;
  }

  // ===== ENDPOINT MODAL =====
  $epSave.on('click', saveEndpoint);
  $epInput.on('keydown', function (e) { if (e.key === 'Enter') saveEndpoint(); });

  function saveEndpoint() {
    let val = $epInput.val().trim();
    if (!val) { $epInput.focus(); return; }
    val = val.replace(/\/+$/, '');
    $epSave.prop('disabled', true).find('span').text('Checking…');
    checkHealth(val)
      .done(function () {
        apiBase = val;
        localStorage.setItem(LS_KEY, val);
        showApp(false);
      })
      .fail(function () {
        $epSave.prop('disabled', false).find('span').text('Connect');
        toast('error', 'Cannot reach the API at ' + val + '. Make sure the server is running and CORS is enabled.');
      });
  }

  function checkHealth(base) {
    // Check API server liveness by requesting root endpoint
    return $.ajax({
      url: base + '/',
      timeout: 6000,
    }).then(
      function () { return $.Deferred().resolve(); },
      function (xhr) {
        if (xhr.status > 0) return $.Deferred().resolve();
        return $.Deferred().reject();
      }
    );
  }

  function showApp(verify) {
    $modal.addClass('hidden');
    $app.removeClass('hidden');
    $epDisplay.text(apiBase);
    if (verify) {
      $statusDot.removeClass('connected');
      $statusText.text('Checking…');
      checkHealth(apiBase)
        .done(function () { $statusDot.addClass('connected'); $statusText.text('Connected'); })
        .fail(function () { $statusDot.removeClass('connected'); $statusText.text('Unreachable'); });
    } else {
      $statusDot.addClass('connected');
      $statusText.text('Connected');
    }
    $urlInput.focus();
  }

  $btnSettings.on('click', function () {
    $epInput.val(apiBase);
    $epSave.prop('disabled', false).find('span').text('Connect');
    $modal.removeClass('hidden');
  });

  // ===== URL INPUT =====
  $urlInput.on('input', function () { $btnClear.toggleClass('hidden', !$(this).val().trim()); });
  $btnClear.on('click', function () { $urlInput.val('').focus(); $btnClear.addClass('hidden'); hideAllResults(); });
  $btnPaste.on('click', async function () {
    try { $urlInput.val(await navigator.clipboard.readText()).trigger('input'); } catch { }
  });

  // ===== COOKIE TOGGLE & VALIDATION =====
  $cookieToggle.on('change', function () {
    $cookiesSec.toggleClass('hidden', !this.checked);
    if (this.checked) { $cookiesArea.focus(); validateCookies(); }
  });

  $cookiesArea.on('input', function () {
    validateCookies();
    localStorage.setItem(LS_COOKIES_KEY, $(this).val());
  });

  function validateCookies() {
    const raw = $cookiesArea.val().trim();
    if (!raw) { $cookiesValid.removeClass('valid invalid').html(''); return false; }
    const lines = raw.split('\n');
    let dataLines = 0, valid = true;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith('#')) continue;
      dataLines++;
      if (line.split('\t').length < 7) { valid = false; break; }
    }
    if (dataLines === 0) { $cookiesValid.removeClass('valid invalid').html(''); return false; }
    if (valid) {
      $cookiesValid.removeClass('invalid').addClass('valid')
        .html('✓ Valid Netscape format — ' + dataLines + ' cookie' + (dataLines !== 1 ? 's' : '') + ' detected');
    } else {
      $cookiesValid.removeClass('valid').addClass('invalid')
        .html('✗ Invalid format — each line must have 7 tab-separated fields');
    }
    return valid;
  }

  function getCookieContent() {
    if (!$cookieToggle.is(':checked')) return null;
    const raw = $cookiesArea.val().trim();
    return raw || null;
  }

  // ===== ACTIONS =====
  $btnInfo.on('click', fetchInfo);
  $btnFormats.on('click', fetchFormats);
  $btnDownload.on('click', function () { $dlOptions.toggleClass('hidden'); });
  $btnStartDl.on('click', startDownload);
  $dlCancel.on('click', cancelDownload);

  $('.format-filters').on('click', '.btn-chip', function () {
    $('.format-filters .btn-chip').removeClass('active');
    $(this).addClass('active');
    filterFormats($(this).data('filter'));
  });

  // ===== HELPERS =====
  function getUrl() {
    const url = $urlInput.val().trim();
    if (!url) { showError('Please enter a URL first.'); $urlInput.focus(); return null; }
    return url;
  }

  function showLoading() {
    hideAllResults();
    $results.removeClass('hidden');
    $loading.removeClass('hidden');
  }

  function hideLoading() { $loading.addClass('hidden'); }

  function showError(msg) {
    hideLoading();
    $results.removeClass('hidden');
    $error.removeClass('hidden');
    $errorMsg.text(msg);
  }

  function hideError() { $error.addClass('hidden'); }

  function hideAllResults() {
    hideError(); hideLoading();
    $infoResult.addClass('hidden');
    $fmtResult.addClass('hidden');
  }

  function formatDuration(s) {
    if (!s) return '—';
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60);
    const p = []; if (h) p.push(h + 'h'); p.push(m + 'm'); p.push(sec + 's');
    return p.join(' ');
  }

  function formatBytes(bytes) {
    if (!bytes) return '—';
    const u = ['B', 'KB', 'MB', 'GB'];
    let i = 0, size = bytes;
    while (size >= 1024 && i < u.length - 1) { size /= 1024; i++; }
    return size.toFixed(i === 0 ? 0 : 1) + ' ' + u[i];
  }

  function formatNumber(n) { return n ? Number(n).toLocaleString() : '—'; }

  function formatUploadDate(d) {
    if (!d || d.length !== 8) return d || '—';
    return d.substring(0, 4) + '-' + d.substring(4, 6) + '-' + d.substring(6, 8);
  }

  // ===== FETCH INFO =====
  function fetchInfo() {
    const url = getUrl(); if (!url) return;
    showLoading();
    $.ajax({ url: apiBase + '/info', data: { url }, dataType: 'json', timeout: 30000 })
      .done(function (data) { hideLoading(); renderInfo(data); })
      .fail(handleError);
  }

  function renderInfo(d) {
    $infoThumb.html(d.thumbnail ? '<img src="' + escapeAttr(d.thumbnail) + '" alt="Thumbnail">' : '');
    const rows = [
      ['Title', d.title || '—'], ['Channel', d.uploader || d.channel || '—'],
      ['Duration', formatDuration(d.duration)], ['Views', formatNumber(d.view_count)],
      ['Likes', formatNumber(d.like_count)],
      ['Upload', d.upload_date ? formatUploadDate(d.upload_date) : '—'],
      ['Source', d.extractor_key || d.extractor || '—'], ['ID', d.id || '—'],
    ];
    let html = '';
    rows.forEach(function (r) {
      html += '<tr><td>' + escapeHtml(r[0]) + '</td><td>' + escapeHtml(r[1]) + '</td></tr>';
    });
    if (d.description) {
      const desc = d.description.length > 300 ? d.description.substring(0, 300) + '…' : d.description;
      html += '<tr><td>Desc</td><td>' + escapeHtml(desc) + '</td></tr>';
    }
    $infoTable.html(html);
    $infoResult.removeClass('hidden');
  }

  // ===== FETCH FORMATS =====
  function fetchFormats() {
    const url = getUrl(); if (!url) return;
    showLoading();
    $.ajax({ url: apiBase + '/formats', data: { url }, dataType: 'json', timeout: 30000 })
      .done(function (data) { hideLoading(); renderFormats(data); })
      .fail(handleError);
  }

  function renderFormats(data) {
    const formats = data.formats || data;
    if (!Array.isArray(formats) || formats.length === 0) { showError('No formats found.'); return; }
    let html = '';
    formats.forEach(function (f) {
      const hasVideo = f.vcodec && f.vcodec !== 'none';
      const hasAudio = f.acodec && f.acodec !== 'none';
      const type = hasVideo ? 'video' : hasAudio ? 'audio' : 'other';
      const codec = hasVideo ? f.vcodec : hasAudio ? f.acodec : '—';
      html += '<tr class="fmt-row is-' + type + '" data-type="' + type + '">';
      html += '<td>' + escapeHtml(f.format_id || '—') + '</td>';
      html += '<td>' + escapeHtml(f.ext || '—') + '</td>';
      html += '<td>' + escapeHtml(f.resolution || (f.width ? f.width + 'x' + f.height : '—')) + '</td>';
      html += '<td>' + (f.fps || '—') + '</td>';
      html += '<td>' + escapeHtml(codec) + '</td>';
      html += '<td>' + formatBytes(f.filesize || f.filesize_approx) + '</td>';
      html += '<td>' + escapeHtml(f.format_note || f.format || '—') + '</td>';
      html += '</tr>';
    });
    $fmtTbody.html(html);
    $('.format-filters .btn-chip').removeClass('active');
    $('.format-filters .btn-chip[data-filter="all"]').addClass('active');
    $fmtResult.removeClass('hidden');
  }

  function filterFormats(filter) {
    if (filter === 'all') $fmtTbody.find('.fmt-row').show();
    else { $fmtTbody.find('.fmt-row').hide(); $fmtTbody.find('.fmt-row[data-type="' + filter + '"]').show(); }
  }

  // ===== DOWNLOAD (IN-PAGE) =====
  function resetDownloadUI() {
    $dlIcon.attr('name', 'cloud-download-outline');
    $dlSpinner.removeClass('done error');
    $dlBarFill.removeClass('done error indeterminate').css('width', '0%');
    $dlTitle.text('Preparing download…');
    $dlSub.text('This may take a moment while the server processes the file');
    $dlPercent.text('Waiting for server…');
    $dlSize.text('');
    $dlCancel.removeClass('hidden');
    $btnStartDl.prop('disabled', true);
  }

  function startDownload() {
    const url = getUrl();
    if (!url) return;

    const cookies = getCookieContent();
    const fmt = $optFormat.val();
    const quality = $optQuality.val();

    // Show progress card
    $results.removeClass('hidden');
    $dlProgress.removeClass('hidden');
    resetDownloadUI();
    $dlBarFill.addClass('indeterminate');

    // Abort controller
    currentDownloadController = new AbortController();
    const signal = currentDownloadController.signal;

    let fetchPromise;

    if (cookies) {
      const body = { url };
      if (fmt) body.format = fmt;
      if (quality) body.quality = quality;
      body.cookies = cookies;

      fetchPromise = fetch(apiBase + '/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: signal,
      });
    } else {
      const params = new URLSearchParams({ url });
      if (fmt) params.set('format', fmt);
      if (quality) params.set('quality', quality);

      fetchPromise = fetch(apiBase + '/download?' + params.toString(), { signal: signal });
    }

    fetchPromise
      .then(function (resp) {
        if (!resp.ok) {
          return resp.text().then(function (body) {
            let msg = resp.status + ' ' + resp.statusText;
            try { const j = JSON.parse(body); if (j.error) msg = j.error; } catch { }
            throw new Error(msg);
          });
        }

        // Extract filename
        const cd = resp.headers.get('Content-Disposition');
        let filename = 'download';
        if (cd) {
          const match = cd.match(/filename\*?=(?:UTF-8'')?["']?([^"';\n]+)/i);
          if (match) filename = decodeURIComponent(match[1]);
        }

        // Get total size for progress
        const contentLength = resp.headers.get('Content-Length');
        const total = contentLength ? parseInt(contentLength, 10) : null;

        if (total) {
          $dlBarFill.removeClass('indeterminate');
          $dlSub.text('Downloading ' + filename);
        } else {
          $dlSub.text('Downloading ' + filename + ' (size unknown)');
        }

        // Stream the response to track progress
        const reader = resp.body.getReader();
        const chunks = [];
        let received = 0;

        function read() {
          return reader.read().then(function (result) {
            if (result.done) return;

            chunks.push(result.value);
            received += result.value.length;

            // Update UI
            $dlSize.text(formatBytes(received) + (total ? ' / ' + formatBytes(total) : ''));

            if (total) {
              const pct = Math.round((received / total) * 100);
              $dlBarFill.css('width', pct + '%');
              $dlPercent.text(pct + '%');
            } else {
              $dlPercent.text(formatBytes(received) + ' received');
            }

            $dlTitle.text('Downloading…');

            return read();
          });
        }

        return read().then(function () {
          return { chunks: chunks, filename: filename, total: received };
        });
      })
      .then(function (result) {
        // Assemble blob and trigger save
        const blob = new Blob(result.chunks);
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = result.filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 200);

        // Success state
        $dlIcon.attr('name', 'checkmark-circle-outline');
        $dlSpinner.addClass('done');
        $dlBarFill.removeClass('indeterminate').addClass('done').css('width', '100%');
        $dlTitle.text('Download complete');
        $dlSub.text(result.filename);
        $dlPercent.text(formatBytes(result.total));
        $dlCancel.addClass('hidden');
        $btnStartDl.prop('disabled', false);

        toast('success', 'Downloaded ' + result.filename);

        // Auto-hide after 5s
        setTimeout(function () {
          $dlProgress.addClass('hidden');
        }, 5000);
      })
      .catch(function (err) {
        if (err.name === 'AbortError') {
          $dlProgress.addClass('hidden');
          $btnStartDl.prop('disabled', false);
          toast('info', 'Download cancelled');
          return;
        }

        // Error state
        $dlIcon.attr('name', 'close-circle-outline');
        $dlSpinner.addClass('error');
        $dlBarFill.removeClass('indeterminate').addClass('error');
        $dlTitle.text('Download failed');
        $dlSub.text(err.message);
        $dlPercent.text('Error');
        $dlSize.text('');
        $dlCancel.addClass('hidden');
        $btnStartDl.prop('disabled', false);

        toast('error', 'Download failed: ' + err.message, 8000);
      });
  }

  function cancelDownload() {
    if (currentDownloadController) {
      currentDownloadController.abort();
      currentDownloadController = null;
    }
  }

  // ===== ERROR HANDLING =====
  function handleError(xhr) {
    hideLoading();
    let msg = 'Request failed.';
    if (xhr.status === 0) {
      msg = 'Cannot reach API. Check your endpoint and ensure CORS is enabled.';
      $statusDot.removeClass('connected');
      $statusText.text('Unreachable');
    } else if (xhr.status === 403) {
      msg = '403 Forbidden — try updating yt-dlp or using a cookie file.';
    } else if (xhr.status === 404) {
      msg = '404 — endpoint not found. Check your API URL.';
    } else if (xhr.status === 500) {
      msg = 'Server error. The URL may be unsupported or yt-dlp encountered an issue.';
    } else if (xhr.responseJSON && xhr.responseJSON.error) {
      msg = xhr.responseJSON.error;
    } else if (xhr.statusText) {
      msg = xhr.status + ': ' + xhr.statusText;
    }
    showError(msg);
  }

  // ===== ESCAPING =====
  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function escapeAttr(str) { return escapeHtml(str); }

  // ===== KEYBOARD SHORTCUTS =====
  $(document).on('keydown', function (e) {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      if (!$dlOptions.hasClass('hidden')) startDownload();
      else $btnDownload.click();
    }
  });
});