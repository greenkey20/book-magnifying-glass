let storyData = []; // storyData를 전역 변수로 선언하되, 초기에는 빈 배열로 둡니다.

document.addEventListener("DOMContentLoaded", async () => {
  // fetch API를 사용하여 JSON 파일 불러오기
  try {
    const response = await fetch("data/stories.json"); // 상대 경로 유지
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    storyData = await response.json(); // 불러온 데이터를 storyData에 할당

    const navList = document.getElementById("navList");
    storyData.forEach((story, index) => {
      const li = document.createElement("li");
      li.innerHTML = `
                <a href="#" data-index="${index}" class="nav-item flex items-center p-3 rounded-lg hover:bg-gray-100 transition-all duration-300 border-l-4 border-transparent">
                    <span class="text-xl mr-3">${story.icon}</span>
                    <span class="font-medium text-gray-700">${story.title}</span>
                </a>
            `;
      navList.appendChild(li);
    });

    navList.addEventListener("click", (e) => {
      e.preventDefault();
      const link = e.target.closest("a");
      if (link && link.dataset.index) {
        activeIndex = parseInt(link.dataset.index, 10);
        updateContent(activeIndex);
      }
    });

    initChart();
    updateContent(0); // 초기 콘텐츠 로드
  } catch (error) {
    console.error("스토리 데이터를 불러오는 데 실패했습니다:", error);
    // 사용자에게 오류 메시지를 표시하는 UI를 추가할 수 있습니다.
    const contentDiv = document.getElementById("content");
    contentDiv.innerHTML = `<p class="text-red-600 text-center text-lg mt-8">스토리 데이터를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.</p>`;
  }
});

function updateContent(index) {
  const story = storyData[index];
  document.getElementById("storyTitle").textContent = story.title;

  const storyImageContainer = document.getElementById("storyImageContainer");
  storyImageContainer.innerHTML = ""; // 이전 이미지 제거

  if (story.imageUrl) {
    const img = document.createElement("img");
    img.src = story.imageUrl;
    img.alt = story.title + " 이미지";
    // max-h-[300px] 제거하여 이미지의 자연스러운 높이 유지
    img.className =
      "w-full h-auto object-contain rounded-lg shadow-md mx-auto block";
    storyImageContainer.appendChild(img);
  }

  document.getElementById("storyText").innerHTML = story.content;

  document.querySelectorAll(".nav-item").forEach((item, i) => {
    if (i === index) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });

  updateChartHighlight(index);
}

function initChart() {
  const ctx = document.getElementById("growthChart").getContext("2d");
  const labels = storyData.map((d) => d.title.split(". ")[1]);
  const data = storyData.map((d) => d.score);

  growthChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "성장 점수",
          data: data,
          fill: true,
          backgroundColor: "rgba(139, 195, 74, 0.1)",
          borderColor: "#689f38",
          borderWidth: 2,
          pointBackgroundColor: "#ffffff",
          pointBorderColor: "#689f38",
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 8,
          tension: 0.3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          max: 10,
          ticks: {
            color: "#4b5563",
          },
          grid: {
            color: "#e5e7eb",
          },
        },
        x: {
          ticks: {
            color: "#4b5563",
            maxRotation: 45,
            minRotation: 0,
            callback: function (value, index, values) {
              const label = this.getLabelForValue(value);
              return label;
            },
          },
          grid: {
            display: false,
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          enabled: true,
          backgroundColor: "#1f2937",
          titleColor: "#ffffff",
          bodyColor: "#ffffff",
          callbacks: {
            title: (context) => context[0].label,
            label: (context) => `성장 점수: ${context.raw}`,
          },
        },
      },
      onClick: (e, elements) => {
        if (elements.length > 0) {
          const dataIndex = elements[0].index;
          activeIndex = dataIndex;
          updateContent(activeIndex);
        }
      },
    },
  });
}

function updateChartHighlight(index) {
  if (!growthChart) return;
  const dataset = growthChart.data.datasets[0];
  const pointRadii = new Array(dataset.data.length).fill(5);
  const pointBackgroundColors = new Array(dataset.data.length).fill("#ffffff");

  pointRadii[index] = 8;
  pointBackgroundColors[index] = "#c5e1a5";

  dataset.pointRadius = pointRadii;
  dataset.pointBackgroundColor = pointBackgroundColors;

  growthChart.update();
}

window.addEventListener("resize", () => {
  if (growthChart) {
    growthChart.options.scales.x.ticks.callback = function (
      value,
      index,
      values
    ) {
      const label = this.getLabelForValue(value);
      return label;
    };
    growthChart.update();
  }
});
