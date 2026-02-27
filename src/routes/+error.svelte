<script>
  import { page } from '$app/stores';
</script>

<svelte:head>
  <title>{$page.status} - 始祖会 Kanto Owners Meeting</title>
  <meta name="description" content="ページが見つかりません - 始祖会 Kanto Owners Meeting">
  <meta name="robots" content="noindex, nofollow">
</svelte:head>

<div class="error-container">
  <h1>{$page.status}</h1>
  <p>{$page.error?.message || 'ページが見つかりません'}</p>
  <a href="/" class="home-link">トップページへ戻る</a>
</div>

<style>
  .error-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 50vh;
    text-align: center;
    padding: 2rem;
  }

  h1 {
    font-size: 4rem;
    margin: 0;
    color: #e60000;
  }

  p {
    font-size: 1.2rem;
    margin: 1rem 0 2rem;
    color: #666;
  }

  .home-link {
    display: inline-block;
    padding: 0.75rem 2rem;
    background-color: #e60000;
    color: white;
    text-decoration: none;
    border-radius: 4px;
    transition: background-color 0.3s;
  }

  .home-link:hover {
    background-color: #cc0000;
  }
</style>