let storyData = [];
let growthChart;
let activeIndex = 0; // 현재 활성화된 챕터의 인덱스 (0은 '여정 소개' 페이지)

document.addEventListener("DOMContentLoaded", async () => {
  const coverPage = document.getElementById("coverPage");
  const mainContent = document.getElementById("mainContent");
  const navList = document.getElementById("navList");

  // 스토리 데이터 불러오기
  try {
    const response = await fetch("data/stories.json");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    storyData = await response.json();

    // 내비게이션 리스트 렌더링 (모든 항목 포함)
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

    // 내비게이션 항목 클릭 이벤트 리스너
    navList.addEventListener("click", (e) => {
      e.preventDefault();
      const link = e.target.closest("a");
      if (link && link.dataset.index) {
        activeIndex = parseInt(link.dataset.index, 10);
        updateDisplay(activeIndex); // 디스플레이 업데이트 함수 호출
      }
    });

    // 초기 로딩 시 '여정 소개' 페이지를 보여줍니다.
    updateDisplay(0); // 0번 인덱스는 '여정 소개' 페이지
    initChart(); // 차트는 일단 초기화 (제목 페이지에서는 숨겨질 것임)
  } catch (error) {
    console.error("스토리 데이터를 불러오는 데 실패했습니다:", error);
    // 오류 발생 시 모든 콘텐츠 숨기기
    coverPage.classList.add("hidden");
    mainContent.classList.add("hidden");
    const appDiv = document.getElementById("app");
    appDiv.innerHTML = `<p class="text-red-600 text-center text-lg mt-8">스토리 데이터를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.</p>`;
  }
});

// 화면 표시를 업데이트하는 새로운 함수
function updateDisplay(index) {
  const coverPage = document.getElementById("coverPage");
  const mainContent = document.getElementById("mainContent");
  const storySection = document.getElementById("story-section");
  const chartSection = document.getElementById("chart-section");
  const activitySheetContainer = document.getElementById(
    "activitySheetContainer"
  );

  // '여정 소개' 페이지인 경우
  if (storyData[index].type === "cover") {
    coverPage.classList.remove("hidden"); // 제목 페이지 보여주기
    mainContent.classList.add("hidden"); // 메인 콘텐츠 숨기기
    activitySheetContainer.classList.add("hidden"); // 활동지 숨기기 (혹시 모를 경우)

    // 제목 페이지 내용 업데이트
    const coverTitleElement = coverPage.querySelector("h2");
    const coverTextElement = coverPage.querySelector(
      'p:not([class*="text-sm"])'
    );
    const coverImageElement = coverPage.querySelector("img");
    const startButton = coverPage.querySelector("#startButton");

    if (coverTitleElement)
      coverTitleElement.textContent = storyData[index].title.split(". ")[1];
    if (coverTextElement) coverTextElement.innerHTML = storyData[index].content;
    if (coverImageElement) coverImageElement.src = storyData[index].imageUrl;

    // '여정 시작하기' 버튼 이벤트 리스너 (제목 페이지가 활성화될 때마다 다시 연결)
    if (startButton) {
      startButton.onclick = () => {
        activeIndex = 1; // 첫 번째 스토리 챕터로 이동
        updateDisplay(activeIndex);
      };
    }
  } else {
    // 일반 스토리 챕터인 경우
    coverPage.classList.add("hidden"); // 제목 페이지 숨기기
    mainContent.classList.remove("hidden"); // 메인 콘텐츠 보여주기

    storySection.classList.remove("hidden");
    chartSection.classList.remove("hidden");

    updateContent(index); // 스토리 콘텐츠 업데이트

    // 활동지 렌더링 로직
    if (storyData[index].activitySheet) {
      renderActivitySheet(index);
      activitySheetContainer.classList.remove("hidden");
    } else {
      activitySheetContainer.classList.add("hidden"); // 활동지 없는 챕터는 숨기기
    }

    updateChartHighlight(index); // 차트 하이라이트 업데이트
  }

  // 내비게이션 활성화 상태 업데이트
  document.querySelectorAll(".nav-item").forEach((item, i) => {
    if (i === index) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });
}

// 챕터 내용만 업데이트하는 기존 함수 (updateDisplay에서 호출됨)
function updateContent(index) {
  const story = storyData[index];
  document.getElementById("storyTitle").textContent = story.title;

  const storyImageContainer = document.getElementById("storyImageContainer");
  storyImageContainer.innerHTML = "";

  if (story.imageUrl) {
    const img = document.createElement("img");
    img.src = story.imageUrl;
    img.alt = story.title + " 이미지";
    img.className =
      "w-full h-auto object-contain rounded-lg shadow-md mx-auto block";
    storyImageContainer.appendChild(img);
  }

  document.getElementById("storyText").innerHTML = story.content;
}

// 활동지 렌더링 및 저장 로직 함수
function renderActivitySheet(index) {
  const activitySheetContainer = document.getElementById(
    "activitySheetContainer"
  );
  const activitySheetTitle = document.getElementById("activitySheetTitle");
  const activityQuestionsContainer = document.getElementById(
    "activityQuestionsContainer"
  );
  const activityActionsList = document.getElementById("activityActionsList");
  const saveActivitySheetButton = document.getElementById("saveActivitySheet");
  const saveMessage = document.getElementById("saveMessage");

  const sheetData = storyData[index].activitySheet;

  activitySheetTitle.textContent = sheetData.title;

  // 질문 섹션 동적 생성
  activityQuestionsContainer.innerHTML = ""; // 기존 내용 초기화
  const savedInputs = JSON.parse(
    localStorage.getItem(`activitySheet_chapter_${index}_inputs`) || "{}"
  );

  sheetData.questions.forEach((q, qIndex) => {
    const questionDiv = document.createElement("div");
    questionDiv.className = "mb-4";
    questionDiv.innerHTML = `
            <p class="text-gray-600 mb-2">${qIndex + 1}. ${q.text}</p>
            <textarea id="activityInput_${
              q.id
            }" class="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 h-24 resize-y" placeholder="여기에 당신의 생각을 적어보세요..."></textarea>
        `;
    activityQuestionsContainer.appendChild(questionDiv);

    // 저장된 내용 불러오기
    const currentInput = document.getElementById(`activityInput_${q.id}`);
    if (currentInput) {
      currentInput.value = savedInputs[q.id] || "";
    }
  });

  // 실천해보기 섹션 동적 생성
  activityActionsList.innerHTML = ""; // 기존 내용 초기화
  sheetData.actions.forEach((action) => {
    const li = document.createElement("li");
    li.className = "text-gray-600";
    li.textContent = action;
    activityActionsList.appendChild(li);
  });

  // '내용 저장하기' 버튼 클릭 이벤트
  // 이벤트 리스너가 중복 등록되지 않도록 기존 리스너 제거 후 추가
  saveActivitySheetButton.onclick = null; // 기존 이벤트 리스너 제거
  saveActivitySheetButton.onclick = () => {
    const currentInputs = {};
    sheetData.questions.forEach((q) => {
      const inputElement = document.getElementById(`activityInput_${q.id}`);
      if (inputElement) {
        currentInputs[q.id] = inputElement.value;
      }
    });
    localStorage.setItem(
      `activitySheet_chapter_${index}_inputs`,
      JSON.stringify(currentInputs)
    );

    saveMessage.classList.remove("hidden");
    setTimeout(() => {
      saveMessage.classList.add("hidden");
    }, 2000); // 2초 후 메시지 숨기기
  };
}

// 차트 초기화 및 업데이트 함수들
function initChart() {
  if (growthChart) {
    growthChart.destroy();
  }

  // '여정 소개' 페이지는 차트 데이터에서 제외
  const chartDataStories = storyData.filter((story) => story.type !== "cover");
  const labels = chartDataStories.map((d) => d.title.split(". ")[1]);
  const data = chartDataStories.map((d) => d.score);

  const ctx = document.getElementById("growthChart").getContext("2d");
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
          // 차트 클릭 시 실제 스토리 챕터 인덱스에 맞춰 updateDisplay 호출
          // storyData의 0번 인덱스가 커버 페이지이므로, 1을 더해줍니다.
          activeIndex = dataIndex + 1;
          updateDisplay(activeIndex);
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

  // 차트 데이터는 커버 페이지를 제외한 스토리 데이터이므로,
  // activeIndex가 0(커버 페이지)이 아니면 해당 챕터에 맞춰 하이라이트
  if (index > 0) {
    pointRadii[index - 1] = 8; // 커버 페이지 제외했으므로 인덱스 -1
    pointBackgroundColors[index - 1] = "#c5e1a5";
  }

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
