<script lang="ts">
  import { onMount } from 'svelte';
  import { Chart, registerables } from 'chart.js';
  import ParticipantsChart from './ParticipantsChart.svelte';

  Chart.register(...registerables);

  let participationCanvas: HTMLCanvasElement;
  let distributionCanvas: HTMLCanvasElement;
  let retentionCanvas: HTMLCanvasElement;
  let frequencyCanvas: HTMLCanvasElement;
  
  let participationChart: Chart;
  let distributionChart: Chart;
  let retentionChart: Chart;
  let frequencyChart: Chart;
  
  let isLoaded = false;

  const totalUniqueUsers = 51;
  const repeatUsers = 29; // 2回以上参加した人数
  const repeatRate = ((repeatUsers / totalUniqueUsers) * 100).toFixed(1); // 56.9%
  const perfectAttendance = 10; // 皆勤者数
  const perfectAttendanceRate = ((perfectAttendance / totalUniqueUsers) * 100).toFixed(1); // 19.6%

  const eventData = {
    events: ['鯨x鯱2023', '2024 Side-A', '2024 Side-B', '2025 Side-A'],
    uniqueUsers: [23, 26, 28, 26],
    newUsers: [23, 13, 11, 4],
    returningUsers: [0, 13, 17, 22]
  };

  const prefectureDistribution = {
    '神奈川県': 17,
    '東京都': 14,
    '千葉県': 10,
    '静岡県': 3,
    '埼玉県': 2,
    '群馬県': 2,
    '山梨県': 1,
    '長野県': 1,
    '大阪府': 1
  };

  const participationFrequency = {
    '1回参加': 22,
    '2回参加': 16,
    '3回参加': 3,
    '4回参加（皆勤）': 10
  };

  onMount(() => {
    try {
      const ctx1 = participationCanvas.getContext('2d');
      if (ctx1) {
        participationChart = new Chart(ctx1, {
          type: 'bar',
          data: {
            labels: eventData.events,
            datasets: [
              {
                label: '新規参加者',
                data: eventData.newUsers,
                backgroundColor: 'rgba(54, 162, 235, 0.8)',
                borderColor: 'rgb(54, 162, 235)',
                borderWidth: 2
              },
              {
                label: 'リピーター',
                data: eventData.returningUsers,
                backgroundColor: 'rgba(255, 99, 132, 0.8)',
                borderColor: 'rgb(255, 99, 132)',
                borderWidth: 2
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              title: {
                display: true,
                text: 'イベント別参加者内訳',
                font: {
                  size: 16
                }
              },
              legend: {
                display: true,
                position: 'top'
              },
              tooltip: {
                callbacks: {
                  afterLabel: function(context) {
                    const total = eventData.uniqueUsers[context.dataIndex];
                    const percentage = ((context.parsed.y / total) * 100).toFixed(1);
                    return `${percentage}% (合計: ${total}人)`;
                  }
                }
              }
            },
            scales: {
              x: {
                stacked: true
              },
              y: {
                stacked: true,
                beginAtZero: true,
                ticks: {
                  callback: function(value) {
                    return value + '人';
                  }
                }
              }
            }
          }
        });
      }

      const ctx2 = distributionCanvas.getContext('2d');
      if (ctx2) {
        // データを降順にソート
        const sortedPrefecture = Object.entries(prefectureDistribution)
          .sort((a, b) => b[1] - a[1]);
        
        distributionChart = new Chart(ctx2, {
          type: 'bar',
          data: {
            labels: sortedPrefecture.map(item => item[0]),
            datasets: [{
              label: '人数',
              data: sortedPrefecture.map(item => item[1]),
              backgroundColor: 'rgba(54, 162, 235, 0.8)',
              borderColor: 'rgb(54, 162, 235)',
              borderWidth: 2
            }]
          },
          options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              title: {
                display: true,
                text: '生息地分布',
                font: {
                  size: 16
                }
              },
              legend: {
                display: false
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    const value = context.parsed.x;
                    const percentage = ((value / totalUniqueUsers) * 100).toFixed(1);
                    return `${value}人 (${percentage}%)`;
                  }
                }
              }
            },
            scales: {
              x: {
                beginAtZero: true,
                ticks: {
                  callback: function(value) {
                    return value + '人';
                  }
                }
              }
            }
          }
        });
      }

      const ctx3 = retentionCanvas.getContext('2d');
      if (ctx3) {
        const retentionRates = eventData.events.map((_, index) => {
          if (index === 0) return 0;
          return parseFloat(((eventData.returningUsers[index] / eventData.uniqueUsers[index]) * 100).toFixed(1));
        });

        retentionChart = new Chart(ctx3, {
          type: 'line',
          data: {
            labels: eventData.events,
            datasets: [{
              label: 'リピーター率',
              data: retentionRates,
              borderColor: 'rgb(75, 192, 192)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              borderWidth: 3,
              fill: true,
              tension: 0.4,
              pointRadius: 6,
              pointHoverRadius: 8
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              title: {
                display: true,
                text: 'リピーター率の推移',
                font: {
                  size: 16
                }
              },
              legend: {
                display: false
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return `リピーター率: ${context.parsed.y}%`;
                  }
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                max: 100,
                ticks: {
                  callback: function(value) {
                    return value + '%';
                  }
                }
              }
            }
          }
        });
      }

      const ctx4 = frequencyCanvas.getContext('2d');
      if (ctx4) {
        frequencyChart = new Chart(ctx4, {
          type: 'pie',
          data: {
            labels: Object.keys(participationFrequency),
            datasets: [{
              data: Object.values(participationFrequency),
              backgroundColor: [
                'rgba(108, 117, 125, 0.8)',
                'rgba(54, 162, 235, 0.8)',
                'rgba(255, 206, 86, 0.8)',
                'rgba(184, 28, 37, 0.8)'
              ],
              borderColor: [
                'rgb(108, 117, 125)',
                'rgb(54, 162, 235)',
                'rgb(255, 206, 86)',
                'rgb(184, 28, 37)'
              ],
              borderWidth: 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              title: {
                display: true,
                text: '参加回数分布',
                font: {
                  size: 16
                }
              },
              legend: {
                position: 'right',
                labels: {
                  generateLabels: function(chart) {
                    const data = chart.data;
                    if (data.labels && data.labels.length && data.datasets.length) {
                      return data.labels.map((label, i) => {
                        const dataset = data.datasets[0];
                        const value = dataset.data[i] as number;
                        const percentage = ((value / totalUniqueUsers) * 100).toFixed(1);
                        const bgColors = dataset.backgroundColor as string[];
                        const borderColors = dataset.borderColor as string[];
                        return {
                          text: `${label} (${percentage}%)`,
                          fillStyle: bgColors[i],
                          strokeStyle: borderColors[i],
                          lineWidth: typeof dataset.borderWidth === 'number' ? dataset.borderWidth : 2,
                          hidden: false,
                          index: i
                        };
                      });
                    }
                    return [];
                  }
                }
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    const label = context.label || '';
                    const value = context.parsed;
                    const percentage = ((value / totalUniqueUsers) * 100).toFixed(1);
                    return `${label}: ${value}人 (${percentage}%)`;
                  }
                }
              }
            }
          }
        });
      }

      isLoaded = true;
    } catch (error) {
      console.error('Chart.js error:', error);
    }
  });
</script>

<div class="statistics-container">
  <div class="header-section">
    <h2 class="main-title">参加者統計データ</h2>
    <div class="summary-card">
      <div class="summary-item">
        <div class="summary-label">総ユニークユーザー数</div>
        <div class="summary-value">{totalUniqueUsers}<span style="font-size: 0.5em; font-weight: normal; margin-left: 4px;">人</span></div>
      </div>
      <div class="summary-item">
        <div class="summary-label">リピーター数（2回以上）</div>
        <div class="summary-value">{repeatUsers}<span style="font-size: 0.5em; font-weight: normal; margin-left: 4px;">人</span></div>
      </div>
      <div class="summary-item">
        <div class="summary-label">リピート率</div>
        <div class="summary-value">{repeatRate}<span style="font-size: 0.5em; font-weight: normal; margin-left: 4px;">%</span></div>
      </div>
      <div class="summary-item">
        <div class="summary-label">皆勤率</div>
        <div class="summary-value">{perfectAttendanceRate}<span style="font-size: 0.5em; font-weight: normal; margin-left: 4px;">%</span></div>
      </div>
    </div>
  </div>

  {#if !isLoaded}
    <div class="loading">グラフを読み込み中...</div>
  {/if}

  <div class="participants-chart-section">
    <ParticipantsChart />
  </div>

  <div class="charts-grid">
    <div class="chart-wrapper">
      <canvas bind:this={participationCanvas}></canvas>
    </div>
    
    <div class="chart-wrapper">
      <canvas bind:this={distributionCanvas}></canvas>
    </div>
    
    <div class="chart-wrapper">
      <canvas bind:this={retentionCanvas}></canvas>
    </div>
    
    <div class="chart-wrapper">
      <canvas bind:this={frequencyCanvas}></canvas>
    </div>
  </div>
</div>

<style>
  .statistics-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 40px 0;
  }

  .header-section {
    margin-bottom: 40px;
  }

  .main-title {
    font-size: 2rem;
    font-weight: bold;
    text-align: center;
    margin-bottom: 30px;
    color: #333;
  }

  .summary-card {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    padding: 0;
    background: transparent;
  }

  .summary-item {
    background: white;
    border-radius: 5px;
    padding: 24px 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    border: 1px solid #e8e8e8;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 100px;
  }

  .summary-item::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 4px;
    background: linear-gradient(90deg, #b81c25, #ff4d56);
  }

  .summary-item:nth-child(2)::before {
    background: linear-gradient(90deg, #36a2eb, #5cb3ff);
  }

  .summary-item:nth-child(3)::before {
    background: linear-gradient(90deg, #ffce56, #ffd875);
  }

  .summary-item:nth-child(4)::before {
    background: linear-gradient(90deg, #4bc0c0, #6dd5d5);
  }

  .summary-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  }

  .summary-label {
    font-size: 0.85rem;
    color: #666;
    font-weight: 500;
    margin-bottom: auto;
    display: block;
    text-align: left;
  }

  .summary-value {
    font-size: 2.2rem;
    font-weight: bold;
    color: #333;
    line-height: 1;
    text-align: right;
    margin-top: 12px;
  }

  .charts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 30px;
    margin-top: 40px;
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

  .participants-chart-section {
    margin: 40px 0;
    max-width: 100%;
  }
  
  .participants-chart-section > :global(.chart-container) {
    margin-bottom: 30px;
  }

  @media (max-width: 768px) {
    .statistics-container {
      padding: 40px 20px;
    }
    
    .summary-card {
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }
    
    .summary-item {
      padding: 16px 12px;
      min-height: 80px;
    }
    
    .summary-label {
      font-size: 0.75rem;
    }

    .charts-grid {
      grid-template-columns: 1fr;
    }

    .chart-wrapper {
      height: 300px;
    }

    .main-title {
      font-size: 1.5rem;
    }

    .summary-value {
      font-size: 1.5rem;
    }

    .participants-chart-section {
      margin: 30px 0;
    }
  }
</style>