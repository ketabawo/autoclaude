<script lang="ts">
  import { onMount } from 'svelte';

  let contactForm = {
    name: '',
    email: '',
    subject: '',
    message: ''
  };
  let isSubmitting = false;
  let submitMessage = '';
  let submitError = '';
  let recaptchaToken = '';

  // reCAPTCHA サイトキー
  const RECAPTCHA_SITE_KEY = '6LfC-JwrAAAAAGbc_p5DwtHvO_TFVFfJ32kZzaiD';

  async function handleContactSubmit(event: Event) {
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
        console.error('EmailJSが読み込まれていません');
        submitError = 'EmailJSの読み込みに時間がかかっています。ページを再読み込みしてください。';
        isSubmitting = false;
        return;
      }

      const templateParams = {
        from_name: contactForm.name,
        from_email: contactForm.email,
        subject: contactForm.subject,
        message: contactForm.message,
        to_name: '始祖会関東',
        'g-recaptcha-response': recaptchaToken
      };

      const response = await emailjs.send(
        'service_6pyl66n',
        'template_lstq8v4',
        templateParams
      );

      if (response.status === 200) {
        submitMessage = 'メッセージを送信しました。ありがとうございます！';
        contactForm = { name: '', email: '', subject: '', message: '' };
        // reCAPTCHAをリセット
        if ((window as any).grecaptcha) {
          (window as any).grecaptcha.reset();
          recaptchaToken = '';
        }
      } else {
        console.error('EmailJS送信失敗:', response);
        submitError = `送信に失敗しました。エラーコード: ${response.status}`;
      }
    } catch (error: any) {
      console.error('送信エラー詳細:', error);

      // エラーの種類を判別
      if (error?.text) {
        console.error('EmailJSエラーメッセージ:', error.text);
        if (error.text.includes('reCAPTCHA')) {
          submitError = 'reCAPTCHA検証に失敗しました。もう一度お試しください。';
        } else if (error.text.includes('template')) {
          submitError = 'テンプレートエラーが発生しました。管理者にお問い合わせください。';
        } else if (error.text.includes('service')) {
          submitError = 'サービスエラーが発生しました。管理者にお問い合わせください。';
        } else {
          submitError = `送信に失敗しました: ${error.text}`;
        }
      } else {
        submitError = '送信に失敗しました。インターネット接続を確認してから再度お試しください。';
      }
    } finally {
      isSubmitting = false;
      setTimeout(() => {
        submitMessage = '';
        submitError = '';
      }, 5000);
    }
  }

  onMount(() => {
    // EmailJSを動的に読み込み
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
    script.onload = () => {
      (window as any).emailjs.init("zEQXn670T2_iNPnp4");
    };
    script.onerror = () => {
      console.error('EmailJSの読み込みに失敗しました');
    };
    document.head.appendChild(script);

    // reCAPTCHAコールバック関数を設定
    (window as any).onRecaptchaSuccess = (token: string) => {
      recaptchaToken = token;
    };

    (window as any).onRecaptchaExpired = () => {
      recaptchaToken = '';
    };
  });
</script>

<svelte:head>
  <title>お問い合わせ | 始祖会 Kanto Owners Meeting</title>
  <meta name="description" content="始祖会Kanto Owners Meetingへのお問い合わせページ。GPZ1000RX・ZX-10オーナーズミーティングに関するご質問・ご要望はこちらから。">
  <link rel="canonical" href="https://kanto.shisokai.info/contact/">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://kanto.shisokai.info/contact/">
  <meta property="og:title" content="お問い合わせ | 始祖会 Kanto Owners Meeting">
  <meta property="og:description" content="始祖会Kanto Owners Meetingへのお問い合わせページ。GPZ1000RX・ZX-10オーナーズミーティングに関するご質問・ご要望はこちらから。">
  <meta property="og:image" content="https://kanto.shisokai.info/images/OGP.png">
  <meta property="og:site_name" content="始祖会 Kanto Owners Meeting">
  <meta property="og:locale" content="ja_JP">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="お問い合わせ | 始祖会 Kanto Owners Meeting">
  <meta name="twitter:description" content="始祖会Kanto Owners Meetingへのお問い合わせページ。GPZ1000RX・ZX-10オーナーズミーティングに関するご質問・ご要望はこちらから。">
  <meta name="twitter:image" content="https://kanto.shisokai.info/images/OGP.png">
  {@html `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "name": "お問い合わせ",
    "description": "始祖会Kanto Owners Meetingへのお問い合わせページ",
    "url": "https://kanto.shisokai.info/contact/"
  })}</script>`}
  <!-- Google reCAPTCHA -->
  <script src="https://www.google.com/recaptcha/api.js" async defer></script>
</svelte:head>

<section class="pageHero">
  <div class="container">
    <h1 class="pageTitle">お問い合わせ</h1>
    <p class="pageSubtitle">Contact</p>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="contactFormContainer">
      <p class="contactDescription">
        始祖会関東に関するご質問や取材のご依頼、その他お問い合わせはこちらのフォームからお送りください。<br>障害等でフォームが動作していない場合や数日経っても連絡が無い場合は、お手数ですがその他の連絡方法で再度お願いいたします。
      </p>

      <form class="contactForm" on:submit={handleContactSubmit}>
        <div class="formGroup">
          <label for="name">お名前 <span class="required">*</span></label>
          <input 
            type="text" 
            id="name" 
            bind:value={contactForm.name}
            required
            disabled={isSubmitting}
            placeholder="赤鯨 鯱太郎"
          />
        </div>

        <div class="formGroup">
          <label for="email">メールアドレス <span class="required">*</span></label>
          <input 
            type="email" 
            id="email" 
            bind:value={contactForm.email}
            required
            disabled={isSubmitting}
            placeholder="example@email.com"
          />
        </div>

        <div class="formGroup">
          <label for="subject">件名 <span class="required">*</span></label>
          <input 
            type="text" 
            id="subject" 
            bind:value={contactForm.subject}
            required
            disabled={isSubmitting}
          />
        </div>

        <div class="formGroup">
          <label for="message">お問い合わせ内容 <span class="required">*</span></label>
          <textarea 
            id="message" 
            rows="8"
            bind:value={contactForm.message}
            required
            disabled={isSubmitting}
            placeholder="お問い合わせ内容をご記入ください"
          ></textarea>
        </div>

        <!-- reCAPTCHA -->
        <div class="formGroup recaptchaContainer">
          <div 
            class="g-recaptcha" 
            data-sitekey={RECAPTCHA_SITE_KEY}
            data-callback="onRecaptchaSuccess"
            data-expired-callback="onRecaptchaExpired"
          ></div>
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
              送信
            {/if}
          </button>
        </div>

        {#if submitMessage}
          <div class="alertSuccess">
            <span class="material-icons">check_circle</span>
            {submitMessage}
          </div>
        {/if}

        {#if submitError}
          <div class="alertError">
            <span class="material-icons">error</span>
            {submitError}
          </div>
        {/if}
      </form>

      <div class="dividerOr">
        <span>または</span>
      </div>

      <div class="alternativeContacts">
        <h2>その他の連絡方法</h2>
        <div class="contactMethods">
          <a href="https://zx10.ketabawo.asia/" target="_blank" rel="noopener" class="contactMethod">
            <span class="material-icons">web</span>
            <span>主宰ブログ</span>
          </a>
          <a href="https://www.instagram.com/zx10.ketabawo/" target="_blank" rel="noopener" class="contactMethod">
            <span class="material-icons">photo_camera</span>
            <span>Instagram</span>
          </a>
          <a href="https://x.com/ketabawo" target="_blank" rel="noopener" class="contactMethod">
            <span class="material-icons">tag</span>
            <span>X (Twitter)</span>
          </a>
        </div>
      </div>
    </div>
  </div>
</section>

<style>
  .pageHero {
    background: linear-gradient(135deg, #eb1000 0%, #c00000 100%);
    color: #fff;
    padding: 60px 0;
    text-align: center;
  }

  .pageTitle {
    font-size: 2.5rem;
    font-weight: bold;
    margin: 0 0 10px 0;
  }

  .pageSubtitle {
    font-size: 1.2rem;
    margin: 0;
    font-family: Arial, Helvetica, sans-serif;
  }

  .section {
    padding: 60px 0;
    background-color: #f9f9f9;
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
  }

  .contactFormContainer {
    max-width: 800px;
    margin: 0 auto;
    padding: 40px;
    background-color: #fff;
    border: 2px solid #e0e0e0;
    border-radius: 10px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  }

  .contactDescription {
    text-align: left;
    color: #666;
    margin-bottom: 30px;
    line-height: 1.8;
    font-size: 0.9rem;
  }

  .dividerOr {
    position: relative;
    text-align: center;
    margin: 40px 0;
  }

  .dividerOr::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    background-color: #ddd;
  }

  .dividerOr span {
    position: relative;
    background-color: #fff;
    padding: 0 20px;
    color: #767676;
    font-size: 0.95rem;
    font-weight: 500;
  }

  .alternativeContacts {
    background-color: #f5f5f5;
    padding: 25px;
    border-radius: 5px;
    margin-top: 0;
  }

  .alternativeContacts h2 {
    margin: 0 0 20px 0;
    color: #333;
    font-size: 1.2rem;
    text-align: center;
  }

  .contactMethods {
    display: flex;
    gap: 20px;
    justify-content: center;
    flex-wrap: wrap;
  }

  .contactMethod {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    background-color: #fff;
    color: #333;
    text-decoration: none;
    border-radius: 5px;
    border: 1px solid #ddd;
    transition: all 0.3s ease;
    font-weight: 500;
  }

  .contactMethod:hover {
    background-color: #eb1000;
    color: #fff;
    border-color: #eb1000;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  }

  .contactMethod .material-icons {
    font-size: 1.2rem;
  }

  .contactForm {
    display: flex;
    flex-direction: column;
    gap: 25px;
  }

  .formGroup {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .formGroup label {
    font-weight: bold;
    color: #333;
    font-size: 1.05rem;
  }

  .required {
    color: #eb1000;
    font-size: 0.9em;
  }

  .formGroup input,
  .formGroup textarea {
    padding: 14px;
    border: 2px solid #ddd;
    border-radius: 5px;
    font-size: 1rem;
    font-family: inherit;
    transition: all 0.3s ease;
  }

  .formGroup input::placeholder,
  .formGroup textarea::placeholder {
    color: #767676;
  }

  .formGroup input:focus,
  .formGroup textarea:focus {
    outline: none;
    border-color: #eb1000;
    box-shadow: 0 0 0 3px rgba(235, 16, 0, 0.1);
  }

  .formGroup input:disabled,
  .formGroup textarea:disabled {
    background-color: #f5f5f5;
    cursor: not-allowed;
  }

  .formGroup textarea {
    resize: vertical;
    min-height: 150px;
  }

  .recaptchaContainer {
    display: flex;
    justify-content: center;
    margin: 20px 0;
  }

  .formActions {
    display: flex;
    justify-content: center;
    margin-top: 10px;
  }

  .btnSubmit {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 15px 50px;
    background-color: #eb1000;
    color: #fff;
    border: none;
    border-radius: 5px;
    font-size: 1.2rem;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .btnSubmit:hover:not(:disabled) {
    background-color: #c00000;
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0,0,0,0.2);
  }

  .btnSubmit:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .alertSuccess,
  .alertError {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 18px;
    border-radius: 5px;
    margin-top: 20px;
    font-weight: 500;
    font-size: 1.05rem;
  }

  .alertSuccess {
    background-color: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
  }

  .alertError {
    background-color: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
  }

  .alertSuccess .material-icons,
  .alertError .material-icons {
    font-size: 1.5rem;
  }

  @media (max-width: 767px) {
    .pageTitle {
      font-size: 2rem;
    }

    .contactFormContainer {
      margin: 0 20px;
      padding: 25px;
    }

    .contactMethods {
      flex-direction: column;
    }

    .contactMethod {
      width: 100%;
      justify-content: center;
    }

    .formGroup input,
    .formGroup textarea {
      font-size: 16px; /* iOS zoom防止 */
    }

    .btnSubmit {
      width: 100%;
      justify-content: center;
      padding: 12px 30px;
      font-size: 1.1rem;
    }
  }
</style>
