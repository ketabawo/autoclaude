<script lang="ts">
  import { onMount } from 'svelte';
  import { Chart, registerables } from 'chart.js';

  // Chart.jsの全機能を登録
  Chart.register(...registerables);

  let canvas: HTMLCanvasElement;
  let chart: Chart;
  let isLoaded = false;

  // 参加者数データ（実際のデータ）
  const participantData = {
    labels: ['鯨x鯱2023', '2024 Side-A', '2024 Side-B', '2025 Side-A'],
    datasets: [
      {
        label: 'GPZ1000RX',
        data: [7, 12, 11, 10],
        borderColor: '#eb1000',
        backgroundColor: 'rgba(235, 16, 0, 0.1)',
        borderWidth: 3,
        fill: false,
        tension: 0.4,
        pointBackgroundColor: '#eb1000',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8
      },
      {
        label: 'ZX-10',
        data: [16, 14, 18, 17],
        borderColor: '#333',
        backgroundColor: 'rgba(51, 51, 51, 0.1)',
        borderWidth: 3,
        fill: false,
        tension: 0.4,
        pointBackgroundColor: '#333',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8
      }
    ]
  };

  onMount(() => {
    try {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      chart = new Chart(ctx, {
        type: 'line',
        data: participantData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: '車種別参加台数の推移',
              font: {
                size: 16
              }
            },
            legend: {
              display: true,
              position: 'top',
              labels: {
                usePointStyle: true,
                padding: 20,
                font: {
                  size: 14
                }
              }
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              titleColor: '#fff',
              bodyColor: '#fff',
              borderColor: '#eb1000',
              borderWidth: 1,
              cornerRadius: 8,
              displayColors: false,
              callbacks: {
                label: function(context) {
                  return `${context.dataset.label}: ${context.parsed.y}台`;
                }
              }
            }
          },
          scales: {
                      x: {
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            },
              ticks: {
                color: '#666',
                font: {
                  size: 12
                }
              }
            },
                      y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            },
              ticks: {
                color: '#666',
                font: {
                  size: 12
                },
                              callback: function(value) {
                return value + '台';
              }
              }
            }
          },
          interaction: {
            intersect: false,
            mode: 'index'
          }
        }
      });

      isLoaded = true;
    } catch (error) {
      console.error('Chart.js error:', error);
    }
  });
</script>

<div class="chart-container">
  {#if !isLoaded}
    <div class="loading">グラフを読み込み中...</div>
  {/if}

  <div class="chart-wrapper">
    <canvas bind:this={canvas}></canvas>
  </div>
</div>

<style>
  .chart-container {
    width: 100%;
  }

  .chart-wrapper {
    position: relative;
    height: 350px;
    padding: 20px;
    background: white;
    border-radius: 5px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  }

  .loading {
    text-align: center;
    color: #666;
    padding: 40px;
    font-size: 1.1rem;
  }

  @media (max-width: 767px) {
    .chart-wrapper {
      height: 300px;
    }
  }
</style> 
