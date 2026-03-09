<script lang="ts">
  import { onMount } from 'svelte';
  import UserStatisticsChart from '$lib/UserStatisticsChart.svelte';

  // ビルド時刻を取得
  const buildTime = new Date().toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/\//g, '.');

  // Type assertions for window globals

  let showModal = false;
  let showEntryModal = false;

  // 参加表明フォーム
  let entryForm = {
    name: '',
    handleName: '',
    email: '',
    bikeModel: 'GPZ1000RX',
    prefecture: '',
    participationRate: '99%',
    companions: '',
    remarks: ''
  };
  let isSubmitting = false;
  let submitMessage = '';
  let submitError = '';
  let recaptchaToken = '';

  // reCAPTCHA サイトキー
  const RECAPTCHA_SITE_KEY = '6LfC-JwrAAAAAGbc_p5DwtHvO_TFVFfJ32kZzaiD';

  // Countdown timer
  let countdownText = '';

  // Hero image - ランダムに1枚を選択
  const heroSlides = [
    { image: '/images/hero-bg0.webp', imageSp: '/images/hero-bg0-sp.webp', photographer: 'konpei104405さん' },
    { image: '/images/hero-bg1.webp', imageSp: '/images/hero-bg1-sp.webp', photographer: 'konpei104405さん' },
    { image: '/images/hero-bg2.webp', imageSp: '/images/hero-bg2-sp.webp', photographer: 'konpei104405さん' }
  ];

  // ページロード時にランダムに1枚を選択
  const randomIndex = Math.floor(Math.random() * heroSlides.length);
  const selectedHeroImage = heroSlides[randomIndex];

  function scrollToFeatures() {
    const featuresSection = document.querySelector('.featuresGrid');
    if (featuresSection && featuresSection instanceof HTMLElement) {
      const headerHeight = 120; // ヘッダーの高さ + 20px
      const targetPosition = featuresSection.offsetTop - headerHeight;

      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    }
  }

  function showPhotoModal() {
    showModal = true;
  }

  function closeModal() {
    showModal = false;
  }

  function showEntryModalHandler() {
    showEntryModal = true;

    // モーダル表示時に初めて外部スクリプトを読み込み
    loadExternalScripts().then(() => {
      setTimeout(() => {
        initRecaptcha();
      }, 200);
    });
  }

  async function loadExternalScripts() {
    // EmailJSが未読み込みの場合のみ読み込み
    if (!(window as any).emailjs) {
      const emailjsScript = document.createElement('script');
      emailjsScript.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
      emailjsScript.async = true;

      await new Promise((resolve) => {
        emailjsScript.onload = () => {
          (window as any).emailjs.init("zEQXn670T2_iNPnp4");
          resolve(true);
        };
        document.head.appendChild(emailjsScript);
      });
    }

    // reCAPTCHAが未読み込みの場合のみ読み込み
    if (!(window as any).grecaptcha) {
      const recaptchaScript = document.createElement('script');
      recaptchaScript.src = 'https://www.google.com/recaptcha/api.js';
      recaptchaScript.async = true;
      recaptchaScript.defer = true;

      await new Promise((resolve) => {
        recaptchaScript.onload = resolve;
        recaptchaScript.onerror = resolve; // エラーでも続行
        document.head.appendChild(recaptchaScript);
      });
    }
  }

  function initRecaptcha() {
    if ((window as any).grecaptcha && (window as any).grecaptcha.render) {
      try {
        const container = document.getElementById('entry-recaptcha');
        if (container && container.innerHTML === '') {
          (window as any).grecaptcha.render('entry-recaptcha', {
            'sitekey': RECAPTCHA_SITE_KEY,
            'callback': (token: string) => {
              recaptchaToken = token;
            },
            'expired-callback': () => {
              recaptchaToken = '';
            }
          });
        }
      } catch (e) {
        console.error('reCAPTCHA初期化エラー:', e);
        // 既に描画済みの場合はリセットを試行
        try {
          (window as any).grecaptcha.reset();
        } catch (resetError) {
          console.error('reCAPTCHAリセットエラー:', resetError);
        }
      }
    } else {
      // reCAPTCHAがまだロードされていない場合は少し待って再試行
      setTimeout(initRecaptcha, 500);
    }
  }

  function closeEntryModal() {
    showEntryModal = false;
    // フォームリセット
    entryForm = {
      name: '', handleName: '', email: '', bikeModel: '',
      prefecture: '', participationRate: '', companions: '', remarks: ''
    };
    submitMessage = '';
    submitError = '';
    recaptchaToken = '';
    if ((window as any).grecaptcha) {
      (window as any).grecaptcha.reset();
    }
  }

  async function handleEntrySubmit(event: Event) {
    event.preventDefault();
    isSubmitting = true;
    submitMessage = '';
    submitError = '';

    try {
      // reCAPTCHA検証
      if (!recaptchaToken) {
        submitError = 'reCAPTCHAの確認を完了してください。';
        isSubmitting = false;
        return;
      }

      // EmailJSが読み込まれるまで待機
      let retryCount = 0;
      const maxRetries = 10;

      while (!(window as any).emailjs && retryCount < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 500));
        retryCount++;
      }

      const emailjs = (window as any).emailjs;

      if (!emailjs) {
        submitError = 'EmailJSの読み込みに時間がかかっています。ページを再読み込みしてください。';
        isSubmitting = false;
        return;
      }

      const templateParams = {
        from_name: entryForm.name,
        handle_name: entryForm.handleName,
        from_email: entryForm.email,
        bike_model: entryForm.bikeModel,
        prefecture: entryForm.prefecture,
        participation_rate: entryForm.participationRate,
        companions: entryForm.companions,
        remarks: entryForm.remarks,
        to_name: '始祖会関東',
        'g-recaptcha-response': recaptchaToken
      };

      const response = await emailjs.send(
        'service_6pyl66n',
        'template_qt944v7',
        templateParams
      );

      if (response.status === 200) {
        submitMessage = 'done';
        entryForm = {
          name: '', handleName: '', email: '', bikeModel: '',
          prefecture: '', participationRate: '', companions: '', remarks: ''
        };
        if ((window as any).grecaptcha) {
          (window as any).grecaptcha.reset();
          recaptchaToken = '';
        }
      } else {
        submitError = `送信に失敗しました。エラーコード: ${response.status}`;
      }
    } catch (error: any) {
      if (error?.text) {
        if (error.text.includes('reCAPTCHA')) {
          submitError = 'reCAPTCHA検証に失敗しました。もう一度お試しください。';
        } else {
          submitError = `送信に失敗しました: ${error.text}`;
        }
      } else {
        submitError = '送信に失敗しました。インターネット接続を確認してから再度お試しください。';
      }
    } finally {
      isSubmitting = false;
    }
  }

  function copyToClipboard(elementId: string) {
    const element = document.getElementById(elementId);
    if (element) {
      const text = element.textContent || '';
      navigator.clipboard.writeText(text).then(() => {
        // コピー成功時の視覚的フィードバック
        const button = element.nextElementSibling;
        if (button) {
          const originalHtml = button.innerHTML;
          button.innerHTML = '<span class="material-icons">check</span>';
          setTimeout(() => {
            button.innerHTML = originalHtml;
          }, 2000);
        }
      }).catch(err => {
        console.error('コピーに失敗しました:', err);
      });
    }
  }

  function updateCountdown() {
    const deadline = new Date('2026-05-10T06:00:00+09:00'); // 2026年5月10日 朝6時（JST）
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();

    if (diff <= 0) {
      countdownText = '受付終了';
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      countdownText = `受付締切まで ${days}日${hours}時間`;
    } else if (hours > 0) {
      countdownText = `受付締切まで ${hours}時間${minutes}分`;
    } else {
      countdownText = `受付締切まで ${minutes}分`;
    }
  }


  // スクロール位置を監視
  onMount(() => {
    // フローティングボタンのイベントリスナー
    const handleOpenEntryModal = () => {
      showEntryModalHandler();
    };
    window.addEventListener('openEntryModal', handleOpenEntryModal);
    // EmailJSを遅延読み込み（モーダル表示時まで読み込み延期）
    // reCAPTCHAも遅延読み込み（モーダル表示時まで読み込み延期）

    // グローバルコールバック関数は不要（render時に直接指定）

    // モバイルデバイスチェック
    const isMobile = window.innerWidth <= 768;

    // Initialize countdown
    updateCountdown();
    const countdownInterval = setInterval(updateCountdown, 60000); // Update every minute

    // メンバーデータを遅延読み込み（モバイルの場合）
    if (isMobile) {
      // モバイルでは2秒後に読み込み開始
    } else {
      // デスクトップでは即座に読み込み
    }

    // 最初の画像のみ即座にプリロード（LCP最適化）
    const firstImg = new Image();
    firstImg.src = heroSlides[0].image;
    firstImg.onload = () => {
      // 初期画像読み込み完了後に背景を更新
      const heroElement = document.querySelector('.hero');
      if (heroElement) {
        heroElement.setAttribute('style', 
          heroElement.getAttribute('style') + 
          `; background-image: linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('${heroSlides[0].image}');`
        );
      }

      // モバイルでは他の画像の読み込みをさらに遅延
      const delay = isMobile ? 3000 : 1000;
      setTimeout(() => {
        heroSlides.slice(1).forEach((slide) => {
          const img = new Image();
          img.src = slide.image;
        });
      }, delay);
    };

    function handleScroll() {
      const freedomStyleElement = document.getElementById('freedom-style');
      if (freedomStyleElement) {
        // 「自由なスタイル」セクションが画面に入ったら表示
      }
    }

    // スクロールイベントにスロットリング追加
    let ticking = false;
    function scrollHandler() {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    }

    window.addEventListener('scroll', scrollHandler, { passive: true });

    // 初期チェック（DOM読み込み完了後）
    setTimeout(handleScroll, 100);

    return () => {
      window.removeEventListener('scroll', scrollHandler);
      window.removeEventListener('openEntryModal', handleOpenEntryModal);
      clearInterval(countdownInterval);
    };
  });

</script>

<svelte:head>
  <link rel="preload" as="image" type="image/webp" href="/images/hero-bg0-sp.webp" media="(max-width: 767px)">
  <link rel="preload" as="image" type="image/webp" href="/images/hero-bg0.webp" media="(min-width: 768px)">
  <title>始祖会 Kanto Owners Meeting【for GPZ1000RX & ZX-10 @関東】</title>
  <meta name="description" content="始祖会Kanto Owners Meetingは春と秋に関東圏（主に神奈川県）で開催されるGPZ1000RX（ZXT00A/鯨）とZX-10（ZXT00B/鯱）オーナーのための交流を主としたオフ会です。2026年5月10日開催予定。もちろん関東圏外からの参加も大歓迎です。">
  <link rel="canonical" href="https://kanto.shisokai.info/">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://kanto.shisokai.info/">
  <meta property="og:title" content="始祖会 Kanto Owners Meeting">
  <meta property="og:description" content="始祖会Kanto Owners Meetingは春と秋に関東圏（主に神奈川県）で開催されるGPZ1000RX（ZXT00A/鯨）とZX-10（ZXT00B/鯱）オーナーのための交流を主としたオフ会です。">
  <meta property="og:image" content="https://kanto.shisokai.info/images/OGP.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="始祖会 Kanto Owners Meeting">
  <meta property="og:locale" content="ja_JP">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="始祖会 Kanto Owners Meeting">
  <meta name="twitter:description" content="始祖会Kanto Owners Meetingは春と秋に関東圏（主に神奈川県）で開催されるGPZ1000RX（ZXT00A/鯨）とZX-10（ZXT00B/鯱）オーナーのための交流を主としたオフ会です。">
  <meta name="twitter:image" content="https://kanto.shisokai.info/images/OGP.png">
  {@html `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Event",
    "name": "始祖会 Kanto Owners Meeting 2026 Side-A",
    "description": "GPZ1000RX・ZX-10オーナーズミーティング。世に回遊している鯨と鯱を愛する孤高な主たちが邂逅を果たせる聖地",
    "url": "https://kanto.shisokai.info",
    "image": [
      "https://kanto.shisokai.info/images/OGP.png",
      "https://kanto.shisokai.info/images/hero-bg0.webp",
      "https://kanto.shisokai.info/images/hero-bg1.webp"
    ],
    "startDate": "2026-05-10T09:00:00+09:00",
    "endDate": "2026-05-10T11:00:00+09:00",
    "eventStatus": "https://schema.org/EventScheduled",
    "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
    "location": {
      "@type": "Place",
      "name": "ライダーズ ベース リバティ",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "西栗原2丁目12-8",
        "addressLocality": "座間市",
        "addressRegion": "神奈川県",
        "postalCode": "252-0016",
        "addressCountry": "JP"
      }
    },
    "organizer": {
      "@type": "Organization",
      "name": "始祖会関東",
      "url": "https://kanto.shisokai.info"
    },
    "performer": {
      "@type": "Organization",
      "name": "始祖会関東",
      "url": "https://kanto.shisokai.info"
    },
    "offers": {
      "@type": "Offer",
      "url": "https://kanto.shisokai.info",
      "price": "0",
      "priceCurrency": "JPY",
      "availability": "https://schema.org/InStock",
      "validFrom": "2026-03-02T00:00:00+09:00"
    }
  })}</script>`}
  {@html `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "始祖会 Kanto Owners Meeting",
    "alternateName": "始祖会関東",
    "url": "https://kanto.shisokai.info",
    "logo": "https://kanto.shisokai.info/images/logo.webp",
    "description": "GPZ1000RX（ZXT00A/鯨）とZX-10（ZXT00B/鯱）オーナーのための交流を主としたオフ会",
    "sameAs": [],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "Customer Support",
      "url": "https://kanto.shisokai.info/contact/"
    }
  })}</script>`}
  {@html `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "始祖会 Kanto Owners Meeting",
    "url": "https://kanto.shisokai.info",
    "description": "GPZ1000RX・ZX-10オーナーズミーティング",
    "publisher": {
      "@type": "Organization",
      "name": "始祖会関東"
    },
    "inLanguage": "ja"
  })}</script>`}
</svelte:head>

<section class="hero">
  <!-- Background image -->
  <div 
    class="hero-bg" 
    style="--hero-bg: url('{selectedHeroImage.image}'); --hero-bg-sp: url('{selectedHeroImage.imageSp}')"
  ></div>

  <div class="container" style="position: relative; z-index: 3;">
    <div class="heroContent">
      <h1><img src="/images/hero-title.webp" alt="Kanto Owners Meeting/関東オーナーズミーティング" class="heroTitleImage" width="3624" height="326" /></h1>
      <p class="heroSubtitle">for <strong title="zxt00a">GPZ1000RX</strong> & <strong title="zxt00b">ZX-10</strong></p>
      <p class="heroDescription">
        世に回遊している鯨と鯱を愛する孤高な主たちが邂逅を果たせる聖地
        <br><span class="heroCatchphrase">2026 Side-A 参加者募集中！</span>
      </p>
      <div class="heroButtons heroButtonsCentered">
        <button class="btn btnPrimary" on:click={showEntryModalHandler}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
          </svg>
          参加する
        </button>
        <button class="btn btnSecondary" on:click={scrollToFeatures}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"/>
            <path d="M16.59 2.59L12 7.17 7.41 2.59 6 4l6 6 6-6z"/>
          </svg>
          もっと詳しく
        </button>
      </div>
      {#if countdownText}
        <div class="countdown">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
            <path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
          </svg>
          {countdownText}
        </div>
      {/if}
    </div>
  </div>
  <div class="heroMetaInfo" style="z-index: 3;">
    <div class="buildTime">更新: {buildTime}</div>
  </div>
  
  <div class="photoCredit" style="z-index: 3;">
    撮影：{selectedHeroImage.photographer}
    <button 
      class="helpIconBtn" 
      on:click={showPhotoModal}
      aria-label="メインビジュアル募集について"
    >
      <span class="material-icons">help_center</span>
    </button>
  </div>
</section>

{#if showModal}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <div class="modalOverlay" on:click={closeModal} on:keydown={(e) => e.key === 'Escape' && closeModal()} role="dialog" aria-modal="true" tabindex="-1">
    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div class="modalContent" on:click|stopPropagation role="document">
      <div class="modalHeader">
        <h3>メインビジュアル募集中</h3>
        <button class="closeIconBtn" on:click={closeModal} aria-label="閉じる">
          <span class="material-icons">close</span>
        </button>
      </div>
      <div class="modalBody">
        <p>始祖会関東公式サイトのメインビジュアル写真を募集しています。</p>
        <p>あなたが撮影したかっこいい写真を掲載させてください。</p>
        <p>お手数ですが主宰ブログやSNSよりご連絡ください。</p>
      </div>
    </div>
  </div>
{/if}

{#if showEntryModal}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <div class="modalOverlay" on:click={closeEntryModal} on:keydown={(e) => e.key === 'Escape' && closeEntryModal()} role="dialog" aria-modal="true" tabindex="-1">
    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div class="entryModalContent" on:click|stopPropagation role="document">
      <div class="modalHeader">
        <h3>始祖会KOM 2026 Side-A参加申込み</h3>
        <button class="closeIconBtn" on:click={closeEntryModal} aria-label="閉じる">
          <span class="material-icons">close</span>
        </button>
      </div>
      <div class="entryModalBody">

        {#if submitMessage === 'done'}
          <div class="submitComplete">
            <span class="material-icons submitCompleteIcon">check_circle</span>
            <h4>参加表明を受け付けました</h4>
            <p>ありがとうございます！</p>
            <p class="submitCompleteNote">※ 自動返信メールは送信されません。<br>数日経っても主宰ブログの参加者一覧が更新されない場合は、<br>他の手段で一報いただけると助かります。</p>
            <button class="btn btnPrimary" on:click={closeEntryModal}>閉じる</button>
          </div>
        {:else}
        <form class="entryForm" on:submit={handleEntrySubmit}>
          <div class="formGroup">
            <label for="entryName">お名前 <span class="required">*</span></label>
            <input 
              type="text" 
              id="entryName" 
              bind:value={entryForm.name}
              required
              disabled={isSubmitting}
              placeholder="赤鯨 鯱太郎"
            />
          </div>

          <div class="formGroup">
            <label for="entryHandleName">ハンドルネーム</label>
            <input 
              type="text" 
              id="entryHandleName" 
              bind:value={entryForm.handleName}
              disabled={isSubmitting}
              placeholder="シャチ太郎"
            />
            <p class="fieldNote">※こちらを入力するとお名前ではなくハンドルネームで表示されます。<br>※主宰がInstagramアカウントを知っている場合はアカウント名を勝手に表示します。</p>
          </div>

          <div class="formGroup">
            <label for="entryEmail">メールアドレス <span class="required">*</span></label>
            <input 
              type="email" 
              id="entryEmail" 
              bind:value={entryForm.email}
              required
              disabled={isSubmitting}
              placeholder="example@email.com"
            />
            <p class="fieldNote">※必ず返信できるメールアドレスを入力してください。</p>
          </div>

          <div class="formGroup">
            <fieldset class="radioFieldset">
              <legend>車種 <span class="required">*</span></legend>
              <div class="radioGroup">
                <label class="radioLabel">
                  <input 
                    type="radio" 
                    name="entryBikeModel" 
                    value="GPZ1000RX"
                    bind:group={entryForm.bikeModel}
                    required
                    disabled={isSubmitting}
                  />
                  GPZ1000RX
                </label>
                <label class="radioLabel">
                  <input 
                    type="radio" 
                    name="entryBikeModel" 
                    value="ZX-10"
                    bind:group={entryForm.bikeModel}
                    required
                    disabled={isSubmitting}
                  />
                  ZX-10
                </label>
              </div>
            </fieldset>
          </div>

          <div class="formGroup">
            <label for="entryPrefecture">生息地（都道府県）<span class="required">*</span></label>
            <select 
              id="entryPrefecture" 
              bind:value={entryForm.prefecture}
              required
              disabled={isSubmitting}
            >
              <option value="">選択してください</option>
              <option value="北海道">北海道</option>
              <option value="青森県">青森県</option>
              <option value="岩手県">岩手県</option>
              <option value="宮城県">宮城県</option>
              <option value="秋田県">秋田県</option>
              <option value="山形県">山形県</option>
              <option value="福島県">福島県</option>
              <option value="茨城県">茨城県</option>
              <option value="栃木県">栃木県</option>
              <option value="群馬県">群馬県</option>
              <option value="埼玉県">埼玉県</option>
              <option value="千葉県">千葉県</option>
              <option value="東京都">東京都</option>
              <option value="神奈川県">神奈川県</option>
              <option value="新潟県">新潟県</option>
              <option value="富山県">富山県</option>
              <option value="石川県">石川県</option>
              <option value="福井県">福井県</option>
              <option value="山梨県">山梨県</option>
              <option value="長野県">長野県</option>
              <option value="岐阜県">岐阜県</option>
              <option value="静岡県">静岡県</option>
              <option value="愛知県">愛知県</option>
              <option value="三重県">三重県</option>
              <option value="滋賀県">滋賀県</option>
              <option value="京都府">京都府</option>
              <option value="大阪府">大阪府</option>
              <option value="兵庫県">兵庫県</option>
              <option value="奈良県">奈良県</option>
              <option value="和歌山県">和歌山県</option>
              <option value="鳥取県">鳥取県</option>
              <option value="島根県">島根県</option>
              <option value="岡山県">岡山県</option>
              <option value="広島県">広島県</option>
              <option value="山口県">山口県</option>
              <option value="徳島県">徳島県</option>
              <option value="香川県">香川県</option>
              <option value="愛媛県">愛媛県</option>
              <option value="高知県">高知県</option>
              <option value="福岡県">福岡県</option>
              <option value="佐賀県">佐賀県</option>
              <option value="長崎県">長崎県</option>
              <option value="熊本県">熊本県</option>
              <option value="大分県">大分県</option>
              <option value="宮崎県">宮崎県</option>
              <option value="鹿児島県">鹿児島県</option>
              <option value="沖縄県">沖縄県</option>
            </select>
          </div>

          <div class="formGroup">
            <fieldset class="radioFieldset">
              <legend>参加確度 <span class="required">*</span></legend>
              <div class="radioGroup">
                <label class="radioLabel">
                  <input 
                    type="radio" 
                    name="entryParticipationRate" 
                    value="99%"
                    bind:group={entryForm.participationRate}
                    required
                    disabled={isSubmitting}
                  />
                  99%
                </label>
                <label class="radioLabel">
                  <input 
                    type="radio" 
                    name="entryParticipationRate" 
                    value="75%"
                    bind:group={entryForm.participationRate}
                    required
                    disabled={isSubmitting}
                  />
                  75%
                </label>
                <label class="radioLabel">
                  <input 
                    type="radio" 
                    name="entryParticipationRate" 
                    value="50%"
                    bind:group={entryForm.participationRate}
                    required
                    disabled={isSubmitting}
                  />
                  50%
                </label>
                <label class="radioLabel">
                  <input 
                    type="radio" 
                    name="entryParticipationRate" 
                    value="30%"
                    bind:group={entryForm.participationRate}
                    required
                    disabled={isSubmitting}
                  />
                  30%
                </label>
              </div>
              <p class="fieldNote">※現在の想定で構いません</p>
            </fieldset>
          </div>

          <div class="formGroup">
            <label for="entryCompanions">同行者数</label>
            <input 
              type="number" 
              id="entryCompanions" 
              bind:value={entryForm.companions}
              min="0"
              max="10"
              disabled={isSubmitting}
              placeholder="0"
            />
          </div>

          <div class="formGroup">
            <label for="entryRemarks">備考</label>
            <textarea 
              id="entryRemarks" 
              rows="3"
              bind:value={entryForm.remarks}
              disabled={isSubmitting}
              placeholder="何かあれば入力ください"
            ></textarea>
          </div>

          <!-- reCAPTCHA -->
          <div class="formGroup recaptchaContainer">
            <div id="entry-recaptcha"></div>
          </div>

          <div class="formActions">
            <button 
              type="submit" 
              class="btnSubmit"
              disabled={isSubmitting}
            >
              {#if isSubmitting}
                送信中...
              {:else}
                参加表明を送信
              {/if}
            </button>
          </div>

          <div class="formNote">
            <p>※ 自動返信メールは送信されません。数日経っても参加者が更新されない場合は他の手段で一報頂けると助かります。</p>
          </div>

          {#if submitError}
            <div class="alertError">
              <span class="material-icons">error</span>
              {submitError}
            </div>
          {/if}
        </form>
        {/if}
      </div>
    </div>
  </div>
{/if}

<section class="section aboutSection">
  <div class="container">
    <h2 class="sectionTitle">始祖会 Kanto Owners Meetingとは</h2>
    <div class="aboutContent">
      <p>
        ロングセラーであるGPZ900RからZZR1100までの過渡期を支えたGPZ1000RXとZX-10を対象とした年2回開催のオーナーズミーティングで、関西エリアで開催されていた現在休止中の「始祖会」から名前をお借りして関東エリアで開催しています。
      </p>
      <p>
        型式「ZXT00」シリーズの起点であるGPZ1000RXと今も尚続く「ZX」シリーズの起点であるZX-10を対象としているのが始祖会の由来だとかなんとか。
      </p>
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="featuresGrid">
      <div class="featureItem" id="freedom-style">
        <div class="featureContent">
          <div class="featureImage" style="background-image: url('/images/feature0.webp')"></div>
          <div class="featureText">
            <h3><span class="material-icons">filter_1</span> 自由なスタイル</h3>
            <p>楽しみ方は十人十色。<br>始祖会関東は組織・団体ではないので所属縛りもなく一般常識のあるGPZ1000RXもしくはZX-10のオーナーであれば基本的に誰でも参加できます。<br>もちろん年齢や性別、所有歴やカスタム有無など一切問わないフラットでフレンドリーな参加者（イケオジ）ばかりなので気軽にお楽しみいただけます。</p>
          </div>
        </div>
      </div>
      <div class="featureItem">
        <div class="featureContent">
          <div class="featureImage" style="background-image: url('/images/feature1.webp')"></div>
          <div class="featureText">
            <h3><span class="material-icons">filter_2</span> 年2回開催</h3>
            <p>始祖会 Kanto Owners Meetingは同一ミーティングとしては珍しい年2回開催なのが大きな特長です。春のSide-AをRX(ZXT00A)、秋のSide-BをZX-10(ZXT00B)とし昭和なカセットテープと掛けています。<br>故障して動けない車両を軽トラに乗せて参加するツワモノもいますよ！<br>関東圏外や新規、女性参加者絶賛募集中〜</p>
          </div>
        </div>
      </div>
      <div class="featureItem">
        <div class="featureContent">
          <div class="featureImage" style="background-image: url('/images/feature2.webp')"></div>
          <div class="featureText">
            <h3><span class="material-icons">filter_3</span> 取り組み</h3>
            <p>セキュリティ強化目的で専用IDカードホルダを無料配布し非参加者と容易に判別できるようにしています。市場価値では測れない大事なあなたの愛車を守るための施策です。<br>また、参加者同士の交流を促す目的もあります。<br>普段からオンラインでも交流できるようLINEグループ<span class="noteMark">（※）</span>もございます。<br><br><span class="noteText">※グループ参加には1度以上参加経験がある事が条件です</span></p>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="section section-gray">
  <div class="container">
    <h2 class="sectionTitle">こんな人におすすめ</h2>
    <div class="recommendationGrid">
      <div class="recommendationItem">
        <div class="recommendationContent">
          <div class="recommendationIcon">
            <span class="material-icons">group</span>
          </div>
          <div class="recommendationText">
            <h3>仲間が欲しい</h3>
            <p>同じバイクに乗る仲間は何人いても困らない。そんな出会いを求めている人にピッタリです。もしかしたら一生の友達ができるかもしれませんよ！？</p>
          </div>
        </div>
      </div>
      <div class="recommendationItem">
        <div class="recommendationContent">
          <div class="recommendationIcon">
            <span class="material-icons">info</span>
          </div>
          <div class="recommendationText">
            <h3>情報が欲しい</h3>
            <p>同じバイク乗りが集まるだけに固有のトラブル解決法やカスタム情報、メンテナンスのノウハウなどが大量に得られる貴重な場所です。</p>
          </div>
        </div>
      </div>
      <div class="recommendationItem">
        <div class="recommendationContent">
          <div class="recommendationIcon">
            <span class="material-icons">directions_bike</span>
          </div>
          <div class="recommendationText">
            <h3>出かける口実が欲しい</h3>
            <p>意味もなくウロウロするのは嫌。そんな目的がないとバイクに乗る事に抵抗がある方はツーリングの目的地・中継地としてご活用ください。</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <UserStatisticsChart />
  </div>
</section>

<section class="section section-gray">
  <div class="container">
    <h2 class="sectionTitle">参加者の声</h2>
    <div class="testimonialsContainer">
      <!-- 常に表示される最初の3件 -->
      <div class="testimonialItem">
        <div class="testimonialContent">
          <div class="testimonialText">
            <p>実車を見つつカスタム・流用・修理など色々な情報もらえて楽しいです。毎回新たな発見が！</p>
          </div>
          <div class="testimonialAuthor">
            <span class="material-icons iconBlack">record_voice_over</span>
            <span>
              <span class="authorName">大阪府 Sさん</span>
              <span class="authorDetail">ZX-10</span>
            </span>
          </div>
        </div>
      </div>

      <div class="testimonialItem">
        <div class="testimonialContent">
          <div class="testimonialText">
            <p>パーツやメンテナンスの情報が少ない車種だけに、愛情込めて所有している皆様のバイクを眺めているだけで発見や気付きがあります♪</p>
          </div>
          <div class="testimonialAuthor">
            <span class="material-icons iconBlack">record_voice_over</span>
            <span>
              <span class="authorName">静岡県 Kさん</span>
              <span class="authorDetail">ZX-10</span>
            </span>
          </div>
        </div>
      </div>

      <div class="testimonialItem">
        <div class="testimonialContent">
          <div class="testimonialText">
            <p>初参加でしたがめちゃ楽しかったです次回も楽しみにしてますよ！</p>
          </div>
          <div class="testimonialAuthor">
            <span class="material-icons iconBlack">record_voice_over</span>
            <span>
              <span class="authorName">千葉県 Kさん</span>
              <span class="authorDetail">ZX-10</span>
            </span>
          </div>
        </div>
      </div>

      <div class="testimonialItem fourthTestimonial">
        <div class="testimonialContent">
          <div class="testimonialText">
            <p>気さくで良い方達ばかりだし、色々な車体を見られるので毎回参加するのが楽しみです！！</p>
          </div>
          <div class="testimonialAuthor">
            <span class="material-icons">record_voice_over</span>
            <span>
              <span class="authorName">山梨県 Sさん</span>
              <span class="authorDetail">GPZ1000RX</span>
            </span>
          </div>
        </div>
      </div>

    </div>

    <div class="showMoreContainer">
      <a href="/voices" class="showMoreButton">
        <span class="material-icons">expand_more</span>
        もっと見る
      </a>
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <h2 class="sectionTitle">よくある質問</h2>
    <div class="faqContainer">
      <!-- 常に表示される最初の3件 -->
      <div class="faqItem">
        <h3 class="faqQuestion"><span class="material-icons">quiz</span>始祖会はクラブですか？</h3>
        <p class="faqAnswer">始祖会関東はオフ会の名称であって組織名称ではありません。よって参加するにあたって所属組織等の縛りは一切ありません。始祖会関東は参加者全員が主役であり、皆様のおかげで成り立っています。</p>
      </div>

      <div class="faqItem">
        <h3 class="faqQuestion"><span class="material-icons">quiz</span>始祖会 Kanto Owners Meetingへの参加方法を教えてください</h3>
        <p class="faqAnswer">ページ内の参加するボタンから必要情報を入力のうえ送信いただくか、主宰ブログやSNS等でも参加表明を受け付けております。</p>
      </div>

      <div class="faqItem">
        <h3 class="faqQuestion"><span class="material-icons">quiz</span>参加費用はかかりますか？</h3>
        <p class="faqAnswer">参加は原則無料です。ただし、開催場所によって有料道路通行料や飲食代がかかる場合があります。</p>
      </div>

    </div>

    <div class="showMoreContainer">
      <a href="/faqs" class="showMoreButton">
        <span class="material-icons">expand_more</span>
        もっと見る (7件)
      </a>
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <h2 class="sectionTitle">次回開催情報</h2>

    <table class="eventTable">
        <tbody>
          <tr>
            <th>イベント名</th>
            <td>始祖会 Kanto Owners Meeting 2026 Side-A</td>
          </tr>
          <tr>
            <th>開催日時</th>
            <td>2026年5月10日（日）9:00〜11:00<br><span class="subTextDark">天候不良等の場合は延期ではなく中止（8日正午までに開催可否を決定し告知します）</span><br><span class="subTextDark">8:00から店舗駐車場に入場できますが、246側の入り口は8:30くらいにならないと開かないので裏から入ってください。</span></td>
          </tr>
          <tr>
            <th>開催場所</th>
            <td>
              <div class="addressContainer">
                <span id="venueAddress">〒252-0016 神奈川県座間市西栗原2丁目12-8</span>
                <button class="copyButton" on:click={() => copyToClipboard('venueAddress')} title="住所をコピー">
                  <span class="material-icons">content_copy</span>
                </button>
              </div>
              <br>ライダーズ ベース リバティ
              <div class="mapContainer" style="margin-top: 15px;">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d8410.932807908695!2d139.411233!3d35.47227!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6018ff23a2f52e19%3A0xcdf38689e8912d13!2zUklERVInUyBCQVNFIFJpYmVydHnvvIjjg6rjg5Djg4bjgqPvvIk!5e1!3m2!1sja!2sjp!4v1754342971602!5m2!1sja!2sjp"
                  width="100%"
                  height="300"
                  style="border:0;"
                  allowfullscreen
                  loading="lazy"
                  referrerpolicy="no-referrer-when-downgrade"
                  title="ライダーズ ベース リバティの地図">
                </iframe>
                <div style="text-align:right;font-size:0.9em;margin-top:4px;">
                  <a href="https://maps.app.goo.gl/adhrpeZGuDuUpFxp7" target="_blank" rel="noopener">Googleマップで開く</a>
                </div>
              </div>
              <div class="accessMapContainer" style="margin-top: 20px;">
                <img src="/images/access-map.webp" alt="会場アクセスマップ" width="846" height="768" style="width: 100%; height: auto; border-radius: 5px;" loading="lazy">
              </div>
            </td>
          </tr>
          <tr>
            <th>参加条件</th>
            <td>GPZ1000RXまたはZX-10で来場できる方<br><span class="subTextDark">老若男女、所有歴やノーマル/カスタム不問。他地域からの参加大歓迎。他車種のお仲間同行参加OKです。</span>
              <br><br>
              <dl class="event-conditions">
                <dt>イベント開催時の注意事項</dt>
                <dd>
                  <ol>
                    <li>違法改造車や排気音の著しく大きいバイクでのご参加はご遠慮ください。</li>
                    <li>当店がある建物の上階はマンションとなっております。近隣住民の方への迷惑になるような無駄な空ぶかしや危険走行等はおやめください。当店の敷地に入ったら、早めのエンジンストップ等、騒音対策へのご配慮をお願いします。</li>
                    <li>喫煙所は店内と屋外にそれぞれ一箇所ずつございます。決められた場所のみでの喫煙をお願いします。</li>
                    <li>写真や動画の撮影、SNS投稿などは、他のお客様へのご配慮の上マナーを守って行ってください。</li>
                    <li>当店の駐車スペースには限りがあるため、イベントの規模によってはお車でのイベント参加の方は、駐車ができない場合がございます。予めご了承ください。その際、近隣施設への違法駐車や路上駐車等は絶対におやめください。</li>
                    <li>イベント開催中における事故・盗難・紛失・怪我など、そのほかトラブルに関しまして、当店では一切の責任を負いかねます。各自、事故や盗難などにご注意をお願いします。</li>
                    <li>その他、イベント主催者が提示した規約等がある場合は、そちらも遵守して頂きますようお願いします。</li>
                  </ol>
                  <p class="note">※上記を守っていただけない方はイベントの退場、退店していただく場合がございます。<br>
                  マナーを守り皆様が楽しく素敵な時間を過ごせますようご協力をお願いします。</p>
                  <p class="signature">Rider's Base Riberty</p>
                </dd>
              </dl>
              <a href="/images/event-conditions.webp" class="original-image-link">原本画像</a>
            </td>
          </tr>
          <tr>
            <th>参加費</th>
            <td>飲食でワンオーダー以上する</td>
          </tr>
          <tr>
            <th>後援協力</th>
            <td>
              <ul style="margin: 0; padding-left: 20px; list-style-type: disc;">
                <li><a href="https://happy-r.co.jp/" target="_blank" rel="noopener noreferrer">Riders Base Riberty</a> さま</li>
                <li><a href="https://event.webike.net/event/4133/" target="_blank" rel="noopener noreferrer">Webike!</a> さま</li>
              </ul>
            </td>
          </tr>

          <tr>
            <th>申し込み方法</th>
            <td>
              <p class="entryNote">参加方向で調整中の方でもお申し込みいただけます</p>
              <button class="btn btnPrimary entryButton" on:click={showEntryModalHandler}>
                <span class="material-icons">event</span>
                参加する
              </button>
              <div class="orDivider">
                <span class="orLine"></span>
                <span class="orText">または</span>
                <span class="orLine"></span>
              </div>
              <div class="socialButtons">
                <a href="https://zx10.ketabawo.asia/" target="_blank" rel="noopener" class="socialButton blogButton">
                  <span class="material-icons">web</span>
                  主宰ブログ
                </a>
                <a href="https://www.instagram.com/zx10.ketabawo/" target="_blank" rel="noopener" class="socialButton instagramButton">
                  <span class="material-icons">photo_camera</span>
                  Instagram
                </a>
                <a href="https://x.com/zx10_ketabawo" target="_blank" rel="noopener" class="socialButton xButton">
                  X (Twitter)
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <th>現在の参加台数</th>
            <td>
              <div class="counterContentInline">
                <div class="counterMainInfo">
                  <div class="counterNumber">
                    <span class="currentCount">25</span>
                    <span class="countUnit">台</span>
                    <span class="targetInfo">/ 目標 30台（達成率: 83%）</span>
                  </div>
                  <div class="bikeBreakdown">
                    <span class="breakdownItem">GPZ1000RX: 10台</span>
                    <span class="divider">|</span>
                    <span class="breakdownItem">ZX-10: 15台</span>
                  </div>
                </div>
                <div class="progressBarContainer">
                  <div class="progressBar" style="width: 83%">
                    <div class="progressBarRX" style="width: 40%"></div>
                    <div class="progressBarZX10" style="width: 60%"></div>
                  </div>
                </div>
                <div class="participantListLink">
                  <a href="https://zx10.ketabawo.asia/2026/03/02/%e5%a7%8b%e7%a5%96%e4%bc%9a-kanto-owners-meeting-2026-side-a%e3%81%ae%e3%81%94%e6%a1%88%e5%86%85/" target="_blank" rel="noopener noreferrer">
                    <span class="material-icons">list_alt</span>
                    参加予定者一覧はブログで公開中！
                  </a>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
  </div>
</section>

<style>
  .hero {
    color: #fff;
    padding: 80px 0;
    text-align: center;
    min-height: 100vh;
    display: flex;
    align-items: center;
    position: relative;
    overflow: hidden;
  }

  .hero-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), var(--hero-bg-sp);
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    z-index: 1;
    opacity: 1;
  }

  @media (min-width: 768px) {
    .hero-bg {
      background-image: linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), var(--hero-bg);
    }
  }

  /* Mobile adjustments */
  @media (max-width: 767px) {
    .heroMetaInfo {
      top: 15px;
      right: 15px;
    }

    .buildTime {
      font-size: 0.7rem;
      padding: 4px 8px;
    }

  }

  .heroMetaInfo {
    position: absolute;
    top: 20px;
    right: 20px;
  }

  .buildTime {
    background: rgba(0, 0, 0, 0.7);
    color: #fff;
    padding: 6px 12px;
    border-radius: 4px;
    font-size: 0.8rem;
    font-family: 'Courier New', monospace;
    backdrop-filter: blur(5px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .photoCredit {
    position: absolute;
    bottom: 20px;
    right: 20px;
    font-size: 0.9rem;
    opacity: 0.8;
    color: #fff;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .modalOverlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .modalContent {
    background-color: #fff;
    border-radius: 5px;
    padding: 0;
    max-width: 500px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
  }

  .modalHeader {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid #e0e0e0;
  }

  .modalHeader h3 {
    margin: 0;
    color: #333;
  }

  .modalBody {
    padding: 20px;
    color: #333;
    line-height: 1.6;
  }

  .noteMark {
    font-size: 0.6em;
    vertical-align: super;
  }

  .noteText {
    font-size: 0.6em;
    color: #666;
  }

  .heroContent {
    padding: 0 20px;
  }

  .heroContent h1 {
    margin: 0;
  }

  .heroTitleImage {
    width: auto;
    height: 50px;
    object-fit: contain;
  }

  @media (min-width: 768px) {
    .heroTitleImage {
      width: 600px;
      height: auto;
    }
  }

  .heroSubtitle {
    font-size: 1.2rem;
    margin: 0 0 30px 0;
    font-family: Arial, Helvetica, sans-serif;
  }

  @media (min-width: 768px) {
    .heroSubtitle {
      font-size: 1.5rem;
    }
  }

  .heroSubtitle strong {
    font-weight: bold;
    font-size: 1.8rem;
  }

  .heroSubtitle:not(strong) {
    font-size: 1em;
  }

  .heroDescription {
    font-size: 1.1rem;
    margin-bottom: 40px;
    line-height: 1.8;
  }

  .heroCatchphrase {
    font-size: 1.5rem;
    font-weight: bold;
    color: #fff;
    display: block;
    margin-top: 20px;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
    animation: blink 3s ease-in-out infinite;
  }

  @keyframes blink {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.3;
    }
  }

  @media (min-width: 768px) {
    .heroCatchphrase {
      font-size: 2.1rem;
    }
  }

  .heroButtons {
    display: flex;
    gap: 20px;
    justify-content: center;
    flex-wrap: wrap;
  }

  .heroButtonsCentered {
    justify-content: center;
  }

  .heroButtons .btn {
    background-color: #b81c25;
    border: 2px solid #b81c25;
    border-radius: 5px;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 15px 40px;
    font-size: 1.2rem;
    width: 100%;
    max-width: 280px;
    color: #fff;
    cursor: pointer;
    transition: all 0.3s ease;
  }


  .heroButtons .btn:hover {
    background-color: #fff;
    color: #b81c25;
  }

  .heroButtons .btnPrimary {
    background-color: #b81c25;
    border-color: #b81c25;
    color: #fff;
  }

  .heroButtons .btnPrimary:hover {
    background-color: #901a20;
    border-color: #901a20;
    color: #fff;
  }

  .heroButtons .btnSecondary {
    background-color: transparent;
    border-color: #fff;
    color: #fff;
  }

  .heroButtons .btnSecondary:hover {
    background-color: #fff;
    color: #333;
    border-color: #fff;
  }

  .countdown {
    margin-top: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: #fff;
    font-size: 1rem;
  }

  .countdown svg {
    width: 1.2rem;
    height: 1.2rem;
  }

  .featuresGrid .featureItem {
    padding: 30px;
    background-color: #fff;
  }

  .featuresGrid .featureItem:nth-child(2) {
    background-color: #f5f5f5;
  }

  .featuresGrid .featureItem:last-child {
    margin-bottom: 0;
  }

  .featuresGrid .featureItem h3 {
    font-size: 1.8rem;
    font-weight: bold;
    margin: 0 0 15px 0;
    color: #333;
  }

  .featuresGrid .featureItem h3 .material-icons {
    color: #b81c25;
    margin-right: 8px;
    font-size: 1.8rem;
    vertical-align: middle;
  }

  .featuresGrid .featureItem p {
    margin-bottom: 0;
    line-height: 1.8;
    font-size: 1.1rem;
  }

  .featureContent {
    display: flex;
    align-items: flex-start;
    gap: 30px;
    max-width: 1200px;
    margin: 0 auto;
  }

  .featureImage {
    flex-shrink: 0;
    width: 400px;
    height: 300px;
    background-color: #f0f0f0;
    background-size: cover;
    background-position: center;
    border-radius: 5px;
  }

  .featureText {
    flex: 1;
  }

  @media (min-width: 768px) {
    .featuresGrid .featureItem:nth-child(2) .featureContent {
      flex-direction: row-reverse;
    }
  }

  @media (max-width: 767px) {
    .featureContent {
      flex-direction: column;
      gap: 20px;
    }

    .featureImage {
      width: 100%;
      height: 200px;
    }
  }

  .featureItem {
    margin-bottom: 30px;
  }

  .featureItem h3 {
    font-size: 1.4rem;
    font-weight: bold;
    margin-bottom: 15px;
    color: #333;
  }

  .featureItem p {
    margin-bottom: 0;
    line-height: 1.8;
    font-size: 1.1rem;
  }

  @media (max-width: 767px) {

    .heroSubtitle {
      font-size: 1.2rem;
    }

    .heroButtons {
      flex-direction: column;
      align-items: center;
    }

    .featuresGrid .featureItem {
      padding: 20px;
    }
  }

  .section-gray {
    background-color: #F5F5F5;
  }

  .sectionTitle {
    font-size: 2rem;
    font-weight: bold;
    text-align: center;
    margin-bottom: 40px;
    color: #333;
  }

  .aboutSection {
    background-color: #f8f8f8;
    padding: 60px 0;
  }

  .aboutContent {
    max-width: 900px;
    margin: 0 auto;
    padding: 0 20px;
    font-size: 1.1rem;
    line-height: 1.8;
  }

  @media (max-width: 767px) {
    .aboutSection {
      padding: 40px 0;
    }

    .aboutContent {
      padding: 0 20px;
      font-size: 1rem;
    }
  }

  .aboutContent p {
    margin-bottom: 20px;
    color: #555;
  }

  .aboutContent p:last-child {
    margin-bottom: 0;
  }

  .recommendationGrid {
    display: grid;
    gap: 30px;
    margin-top: 40px;
    max-width: 1200px;
    margin-left: auto;
    margin-right: auto;
  }

  @media (min-width: 768px) {
    .recommendationGrid {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  .recommendationItem {
    background-color: #fff;
    border: 2px solid #ccc;
    border-radius: 5px;
    padding: 30px;
    text-align: left;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }

  .recommendationContent {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
  }

  .recommendationIcon {
    width: 80px;
    height: 80px;
    background-color: #b81c25;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 10px;
  }

  .recommendationIcon .material-icons {
    font-size: 3rem;
    color: #fff;
  }

  .recommendationText h3 {
    font-size: 1.4rem;
    font-weight: bold;
    margin: 0 0 15px 0;
    color: #333;
    text-align: center;
  }

  .recommendationText p {
    margin: 0;
    line-height: 1.8;
    font-size: 1rem;
    color: #666;
    text-align: left;
  }

  @media (max-width: 767px) {
    .recommendationGrid {
      grid-template-columns: 1fr;
      padding: 0 20px;
    }

    .recommendationItem {
      padding: 20px;
    }

    .recommendationIcon {
      width: 60px;
      height: 60px;
    }

  }

  .eventTable {
    max-width: 1200px;
    margin: 40px auto 0;
    width: 100%;
    border-collapse: collapse;
    background-color: #f9f9f9;
    border: 2px solid #ccc;
    border-radius: 5px;
    overflow: hidden;
    box-sizing: border-box;
  }

  .eventTable th {
    background-color: #f5f5f5;
    padding: 20px;
    text-align: left;
    font-weight: bold;
    color: #333;
    border-bottom: 1px solid #ccc;
    width: 30%;
    vertical-align: top;
  }

  .eventTable td {
    padding: 20px;
    border-bottom: 1px solid #ccc;
    color: #333;
    line-height: 1.8;
  }

  .subTextDark {
    font-size: 0.8em;
    color: #666;
  }

  .eventTable tr:last-child th,
  .eventTable tr:last-child td {
    border-bottom: none;
  }

  .eventTable tr:hover {
    background-color: #f9f9f9;
  }

  .eventTable a {
    color: #0066cc;
    text-decoration: none;
  }

  .eventTable a:hover {
    color: #0052a3;
    text-decoration: underline;
  }

  @media (max-width: 767px) {
    .eventTable {
      margin: 40px 20px 0;
      width: calc(100% - 40px);
    }

    .eventTable td {
      padding: 12px 8px;
      font-size: 0.85rem;
    }

    .eventTable th {
      width: 20%;
      padding: 12px 8px;
      font-size: 0.85rem;
    }
  }

  .faqContainer {
    max-width: 1200px;
    margin: 0 auto;
    margin-top: 40px;
  }

  .faqItem {
    border: 2px solid #ccc;
    border-radius: 5px;
    margin-bottom: 20px;
    background-color: #fff;
    overflow: hidden;
    transition: all 0.3s ease;
  }

  .faqQuestion {
    background-color: #f5f5f5;
    padding: 20px;
    margin: 0;
    font-size: 1.2rem;
    font-weight: bold;
    color: #333;
    border-bottom: 1px solid #ccc;
    cursor: pointer;
    transition: background-color 0.3s ease;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .faqQuestion .material-icons {
    font-size: 1.5rem;
    color: #b81c25;
  }

  .faqItem:hover .faqQuestion {
    background-color: #e8e8e8;
  }

  .faqAnswer {
    padding: 20px;
    margin: 0;
    line-height: 1.8;
    color: #666;
    font-size: 1rem;
  }

  @media (max-width: 767px) {
    .faqContainer {
      padding: 0 20px;
    }

    .faqQuestion {
      padding: 15px;
      font-size: 1.1rem;
    }

    .faqAnswer {
      padding: 15px;
      font-size: 0.95rem;
    }
  }

  .testimonialsContainer {
    max-width: 1200px;
    margin: 0 auto;
    margin-top: 40px;
    display: grid;
    gap: 30px;
    padding: 20px;
  }

  /* デスクトップでは4件目を非表示 */
  .fourthTestimonial {
    display: none;
  }

  @media (min-width: 768px) {
    .testimonialsContainer {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  .testimonialItem {
    background-color: #fff;
    border-radius: 5px;
    border: 2px solid #e0e0e0;
    padding: 0;
    transition: all 0.3s ease;
    overflow: visible;
    position: relative;
    height: 100%;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    box-sizing: border-box;
  }

  .testimonialItem:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
  }

  .testimonialContent {
    display: flex;
    flex-direction: column;
    gap: 0;
    height: 100%;
    padding: 25px;
  }

  .testimonialText {
    background-color: #F9F9F9;
    padding: 25px;
    border-radius: 5px;
    position: relative;
    margin-bottom: 15px;
    flex: 1;
    display: flex;
    align-items: flex-start;
  }

  .testimonialText::after {
    content: '';
    position: absolute;
    bottom: -10px;
    left: 10px;
    width: 0;
    height: 0;
    border-left: 10px solid transparent;
    border-right: 10px solid transparent;
    border-top: 10px solid #f5f5f5;
  }

  .testimonialText p {
    margin: 0;
    line-height: 1.4;
    font-size: 1rem;
    color: #333;
    font-style: normal;
  }

  .testimonialAuthor {
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 0;
  }

  .testimonialAuthor .material-icons {
    font-size: 2.5rem;
    color: #b81c25;
    background-color: #fff;
    border: 2px solid #b81c25;
    border-radius: 5px;
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .testimonialAuthor .material-icons.iconBlack {
    color: #000;
    border-color: #000;
  }

  .testimonialAuthor > span:not(.material-icons) {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .authorName {
    font-weight: bold;
    color: #333;
    font-size: 1rem;
  }

  .authorDetail {
    color: #666;
    font-size: 0.9rem;
  }

  /* もっと見るボタン */
  .showMoreContainer {
    text-align: center;
    margin-top: 30px;
  }

  .showMoreButton {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background-color: #f8f9fa;
    border: 2px solid #dee2e6;
    border-radius: 25px;
    padding: 12px 24px;
    font-size: 1rem;
    font-weight: 500;
    color: #495057;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .showMoreButton:hover {
    background-color: #e9ecef;
    border-color: #adb5bd;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  .showMoreButton .material-icons {
    font-size: 1.2rem;
    transition: transform 0.3s ease;
  }

  .showMoreButton:hover .material-icons {
    transform: scale(1.1);
  }


  @media (max-width: 767px) {
    .testimonialsContainer {
      padding: 0 20px;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
    }

    .testimonialItem {
      padding: 0;
    }

    .testimonialContent {
      padding: 10px;
    }

    .testimonialText p {
      font-size: 0.95rem;
    }

    .showMoreButton {
      padding: 10px 20px;
      font-size: 0.9rem;
    }

    /* モバイルでは4件目を表示 */
    .fourthTestimonial {
      display: block;
    }

    /* 統合された参加台数表示のレスポンシブ対応 */
    .counterContentInline .currentCount {
      font-size: 1.8rem;
    }

    .counterContentInline .countUnit {
      font-size: 1rem;
    }

    .targetInfo {
      display: block;
      margin-left: 0;
      margin-top: 5px;
    }

    .counterContentInline .bikeBreakdown {
      flex-direction: row;
      gap: 8px;
      align-items: center;
      font-size: 0.85rem;
    }

    .counterContentInline .divider {
      display: inline;
    }
  }

  /* リンクの色 */
  a {
    color: #1e90ff;
    text-decoration: none;
  }

  a:hover {
    color: #4169e1;
    text-decoration: underline;
  }

  /* 参加台数カウンター */
  /* 統合された参加台数表示用のスタイル */
  .counterContentInline {
    padding: 15px 0;
  }

  .counterMainInfo {
    margin-bottom: 15px;
  }

  .counterContentInline .counterNumber {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin-bottom: 10px;
  }

  .counterContentInline .currentCount {
    font-size: 2rem;
    font-weight: bold;
    color: #800000;
  }

  .counterContentInline .countUnit {
    font-size: 1.2rem;
    color: #333;
  }

  .targetInfo {
    font-size: 0.9rem;
    color: #666;
    margin-left: 10px;
  }

  .counterContentInline .bikeBreakdown {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 10px;
    font-size: 0.9rem;
    color: #666;
  }

  .counterContentInline .progressBarContainer {
    position: relative;
    background-color: #ddd;
    height: 25px;
    border-radius: 5px;
    overflow: hidden;
    margin: 15px 0;
  }

  .counterContentInline .participantListLink {
    margin-top: 10px;
  }

  .counterContentInline .participantListLink a {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: #b81c25;
    text-decoration: none;
    font-size: 0.9rem;
    transition: opacity 0.3s;
  }

  .counterContentInline .participantListLink a:hover {
    opacity: 0.7;
  }


  .divider {
    color: #767676;
  }

  .currentCount {
    font-size: 3.5rem;
    font-weight: bold;
    color: #800000;
    font-family: 'Arial Black', Arial, sans-serif;
    line-height: 1.1;
  }

  .countUnit {
    font-size: 1.5rem;
    color: #333;
    margin-left: 5px;
  }

  .progressBarContainer {
    position: relative;
    background-color: #ddd;
    height: 30px;
    border-radius: 5px;
    overflow: hidden;
    margin-bottom: 15px;
  }

  .progressBar {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    border-radius: 5px;
    transition: width 0.5s ease;
    display: flex;
    overflow: hidden;
  }

  .progressBarRX {
    height: 100%;
    background: linear-gradient(90deg, #b81c25 0%, #d42834 100%);
  }

  .progressBarZX10 {
    height: 100%;
    background: linear-gradient(90deg, #333 0%, #666 100%);
  }

  .participantListLink {
    margin-top: 15px;
    text-align: center;
  }

  .participantListLink a {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    background-color: #f8f9fa;
    color: #495057;
    text-decoration: none;
    border-radius: 5px;
    font-size: 0.9rem;
    font-weight: 500;
    border: 1px solid #dee2e6;
    transition: all 0.2s ease;
  }

  .participantListLink a:hover {
    background-color: #e9ecef;
    color: #212529;
    text-decoration: none;
    transform: translateY(-1px);
  }

  .participantListLink .material-icons {
    font-size: 1rem;
  }

  @media (max-width: 767px) {
    .currentCount {
      font-size: 2.5rem;
    }

    .countUnit {
      font-size: 1.2rem;
    }

    .bikeBreakdown {
      flex-direction: column;
      gap: 5px;
    }

    .divider {
      display: none;
    }

    .participantListLink a {
      font-size: 0.85rem;
      padding: 6px 12px;
    }
  }

  /* 住所コピー機能 */
  .addressContainer {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  .copyButton {
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    color: #666;
    transition: color 0.3s ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .copyButton:hover {
    color: #333;
  }

  .copyButton .material-icons {
    font-size: 18px;
  }

  /* 参加表明モーダル */
  .entryModalContent {
    background-color: #fff;
    border-radius: 5px;
    padding: 0;
    max-width: 600px;
    width: 95%;
    max-height: 90vh;
    overflow-y: auto;
  }

  .entryModalBody {
    padding: 20px 30px 30px;
    color: #333;
  }

  .entryForm {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .entryForm .formGroup {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .entryForm label {
    font-weight: bold;
    color: #333;
    font-size: 0.95rem;
  }

  .radioFieldset {
    border: none;
    padding: 0;
    margin: 0;
  }

  .radioFieldset legend {
    font-weight: bold;
    color: #333;
    font-size: 0.95rem;
    padding: 0;
    margin-bottom: 6px;
  }

  .entryForm .required {
    color: #b81c25;
    font-size: 0.9em;
  }

  .entryForm input,
  .entryForm select,
  .entryForm textarea {
    padding: 10px 12px;
    border: 1px solid #ddd;
    border-radius: 5px;
    font-size: 0.95rem;
    font-family: inherit;
    transition: border-color 0.3s ease;
  }

  .entryForm input::placeholder,
  .entryForm textarea::placeholder {
    color: #767676;
    opacity: 1;
  }

  .entryForm input:focus,
  .entryForm select:focus,
  .entryForm textarea:focus {
    outline: none;
    border-color: #b81c25;
    box-shadow: 0 0 0 2px rgba(235, 16, 0, 0.1);
  }

  .entryForm input:disabled,
  .entryForm select:disabled,
  .entryForm textarea:disabled {
    background-color: #f5f5f5;
    cursor: not-allowed;
  }

  .entryForm textarea {
    resize: vertical;
    min-height: 80px;
  }

  .fieldNote {
    font-size: 0.75rem;
    color: #666;
    margin: 2px 0 0 0;
    line-height: 1.3;
  }

  .radioGroup {
    display: flex;
    gap: 15px;
    flex-wrap: wrap;
    margin-top: 5px;
  }

  .radioLabel {
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: normal;
    cursor: pointer;
    font-size: 0.95rem;
  }

  .radioLabel input[type="radio"] {
    width: auto;
    margin: 0;
    transform: scale(0.9);
  }

  .recaptchaContainer {
    display: flex;
    justify-content: center;
    margin: 15px 0;
  }

  .formActions {
    display: flex;
    justify-content: center;
    margin-top: 10px;
  }

  .btnSubmit {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 30px;
    background-color: #b81c25;
    color: #fff;
    border: none;
    border-radius: 5px;
    font-size: 1rem;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .btnSubmit:hover:not(:disabled) {
    background-color: #901a20;
    transform: translateY(-1px);
  }

  .btnSubmit:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .submitComplete {
    text-align: center;
    padding: 40px 20px;
  }

  .submitCompleteIcon {
    font-size: 4rem;
    color: #28a745;
  }

  .submitComplete h4 {
    font-size: 1.4rem;
    margin: 15px 0 10px;
    color: #333;
  }

  .submitComplete p {
    color: #555;
    margin: 5px 0;
  }

  .submitCompleteNote {
    font-size: 0.85rem;
    color: #767676;
    margin: 20px 0;
    line-height: 1.8;
  }

  .submitComplete .btn {
    margin-top: 10px;
  }

  .alertError {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px;
    border-radius: 5px;
    margin-top: 15px;
    font-size: 0.9rem;
    background-color: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
  }

  .alertError .material-icons {
    font-size: 1.1rem;
    margin-right: 8px;
    vertical-align: middle;
  }

  .formNote {
    margin-top: 10px;
    text-align: center;
  }

  .formNote p {
    margin: 0;
    font-size: 0.85rem;
    color: #666;
    font-style: italic;
  }

  @media (max-width: 767px) {
    .entryModalContent {
      width: 100%;
      max-width: none;
      margin: 10px;
      max-height: 95vh;
    }

    .entryModalBody {
      padding: 15px 20px 20px;
    }

    .entryForm {
      gap: 15px;
    }

    .entryForm input,
    .entryForm select,
    .entryForm textarea {
      font-size: 16px; /* iOS zoom防止 */
    }

    .radioGroup {
      flex-direction: column;
      gap: 8px;
    }

    .btnSubmit {
      width: 100%;
      justify-content: center;
    }
  }

  /* ソーシャルボタン */
  .entryNote {
    font-size: 0.9rem;
    color: #666;
    margin-bottom: 15px;
    line-height: 1.6;
  }

  .entryButton {
    background-color: #b81c25;
    border: 2px solid #b81c25;
    border-radius: 5px;
    font-weight: bold;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 30px;
    font-size: 1.1rem;
    color: #fff;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-bottom: 20px;
  }

  .entryButton:hover {
    background-color: #901a20;
    border-color: #901a20;
  }

  .orDivider {
    display: flex;
    align-items: center;
    margin: 20px 0;
    width: 100%;
  }

  .orLine {
    flex: 1;
    height: 1px;
    background-color: #ddd;
  }

  .orText {
    padding: 0 15px;
    color: #666;
    font-size: 0.9rem;
  }

  .socialButtons {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .socialButton {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    border-radius: 5px;
    text-decoration: none;
    font-size: 0.85rem;
    font-weight: 500;
    transition: all 0.3s ease;
    border: 1px solid;
  }

  .socialButton:hover {
    text-decoration: none;
  }

  .blogButton {
    background-color: #fff;
    color: #333 !important;
    border-color: #ccc;
  }

  .blogButton:hover {
    transform: translateY(-2px);
    color: #333 !important;
  }

  .instagramButton {
    background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);
    color: #fff !important;
    border-color: #bc1888;
  }

  .instagramButton:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 10px rgba(240, 148, 51, 0.3);
    color: #fff !important;
  }

  .xButton {
    background-color: #000;
    color: #fff !important;
    border-color: #000;
  }

  .xButton:hover {
    transform: translateY(-2px);
    color: #fff !important;
  }

  .socialButton .material-icons {
    font-size: 1rem;
  }

  @media (max-width: 767px) {
    .entryButton {
      width: 100%;
      padding: 12px 20px;
      font-size: 1rem;
    }

    .socialButtons {
      flex-direction: column;
      gap: 8px;
    }

    .socialButton {
      width: 100%;
      justify-content: center;
      padding: 10px;
      font-size: 0.9rem;
    }
  }

  /* Event conditions styling */
  .event-conditions {
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    padding: 20px;
    margin: 0;
  }

  .event-conditions dt {
    font-size: 1.1rem;
    font-weight: bold;
    color: #212529;
    margin-bottom: 25px;
    padding-bottom: 10px;
    border-bottom: 2px solid #333;
    text-align: center;
  }

  .event-conditions dd {
    margin: 0;
  }

  .event-conditions ol {
    margin: 0 0 20px 0;
    padding-left: 25px;
    counter-reset: item;
  }

  .event-conditions ol li {
    margin-bottom: 12px;
    line-height: 1.6;
    color: #495057;
    font-size: 0.95rem;
    position: relative;
    padding-left: 5px;
  }

  .event-conditions ol li::marker {
    color: #333;
    font-weight: bold;
  }

  .event-conditions .note {
    margin: 20px 0 15px 0;
    padding: 12px;
    background: #f5f5f5;
    border-left: 4px solid #666;
    color: #333;
    font-size: 0.9rem;
    line-height: 1.5;
  }

  .event-conditions .signature {
    text-align: right;
    font-style: italic;
    color: #595959;
    margin: 10px 0 0 0;
    font-size: 0.95rem;
  }

  .original-image-link {
    display: inline-block;
    margin-top: 10px;
    color: #333;
    text-decoration: none;
    font-size: 0.9rem;
    padding: 5px 10px;
    border: 1px solid #333;
    border-radius: 4px;
    transition: all 0.3s ease;
  }

  .original-image-link:hover {
    background: #333;
    color: white;
  }

  @media (max-width: 767px) {
    .event-conditions {
      padding: 15px;
    }

    .event-conditions dt {
      font-size: 1rem;
    }

    .event-conditions ol li {
      font-size: 0.9rem;
      margin-bottom: 10px;
    }

    .event-conditions .note {
      font-size: 0.85rem;
      padding: 10px;
    }
  }
</style>

