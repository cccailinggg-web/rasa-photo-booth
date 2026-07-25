(() => {
  "use strict";

  const FRAME_WIDTH = 1633;
  const FRAME_HEIGHT = 2048;

  const frames = [
    { name: "紅 × 綠", src: "./assets/frame-red.png" },
    { name: "綠 × 橘", src: "./assets/frame-green.png" },
    { name: "橘 × 紅", src: "./assets/frame-orange.png" },
  ];

  const elements = {
    introScreen: document.querySelector("#introScreen"),
    cameraScreen: document.querySelector("#cameraScreen"),
    resultScreen: document.querySelector("#resultScreen"),
    startButton: document.querySelector("#startButton"),
    cameraSwitchButton: document.querySelector("#cameraSwitchButton"),
    cameraStage: document.querySelector("#cameraStage"),
    cameraVideo: document.querySelector("#cameraVideo"),
    cameraStatus: document.querySelector("#cameraStatus"),
    frameOverlay: document.querySelector("#frameOverlay"),
    frameOptions: [...document.querySelectorAll(".frame-option")],
    captureButton: document.querySelector("#captureButton"),
    permissionHelp: document.querySelector("#permissionHelp"),
    permissionMessage: document.querySelector("#permissionMessage"),
    retryButton: document.querySelector("#retryButton"),
    captureCanvas: document.querySelector("#captureCanvas"),
    resultImage: document.querySelector("#resultImage"),
    shareButton: document.querySelector("#shareButton"),
    downloadButton: document.querySelector("#downloadButton"),
    retakeButton: document.querySelector("#retakeButton"),
  };

  const state = {
    stream: null,
    selectedFrameIndex: 0,
    facingMode: "user",
    frameImages: [],
    capturedBlob: null,
    resultObjectUrl: "",
    isStartingCamera: false,
  };

  function showScreen(screenName) {
    const screenMap = {
      intro: elements.introScreen,
      camera: elements.cameraScreen,
      result: elements.resultScreen,
    };

    Object.values(screenMap).forEach((screen) => {
      screen.classList.remove("is-active");
    });

    screenMap[screenName].classList.add("is-active");
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  function setCameraStatus(message = "", visible = true) {
    elements.cameraStatus.textContent = message;
    elements.cameraStatus.hidden = !visible;
  }

  async function preloadFrames() {
    state.frameImages = await Promise.all(
      frames.map(
        (frame) =>
          new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = () => reject(new Error(`無法讀取套框：${frame.name}`));
            image.src = frame.src;
          }),
      ),
    );
  }

  function stopCamera() {
    if (state.stream) {
      state.stream.getTracks().forEach((track) => track.stop());
      state.stream = null;
    }

    elements.cameraVideo.srcObject = null;
    elements.captureButton.disabled = true;
  }

  function getCameraErrorMessage(error) {
    switch (error?.name) {
      case "NotAllowedError":
      case "SecurityError":
        return "相機權限被拒絕。請在瀏覽器的網站設定中允許使用相機，再重新嘗試。";
      case "NotFoundError":
      case "OverconstrainedError":
        return "找不到可使用的相機。請確認裝置是否有相機，或改用另一個瀏覽器。";
      case "NotReadableError":
      case "AbortError":
        return "相機目前可能被其他 App 使用。請關閉其他相機或視訊 App 後再試一次。";
      default:
        return "無法開啟相機。請確認使用 HTTPS 網址，並改用 Safari 或 Chrome 重新開啟。";
    }
  }

  async function requestCameraStream(facingMode) {
    const preferredConstraints = {
      audio: false,
      video: {
        facingMode: { exact: facingMode },
        width: { ideal: 1920 },
        height: { ideal: 1920 },
      },
    };

    try {
      return await navigator.mediaDevices.getUserMedia(preferredConstraints);
    } catch (error) {
      if (error?.name !== "OverconstrainedError" && error?.name !== "NotFoundError") {
        throw error;
      }

      return navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1920 },
        },
      });
    }
  }

  async function startCamera() {
    if (state.isStartingCamera) return;

    state.isStartingCamera = true;
    elements.permissionHelp.hidden = true;
    elements.captureButton.disabled = true;
    setCameraStatus("正在開啟相機…", true);

    if (!navigator.mediaDevices?.getUserMedia) {
      const message = "這個瀏覽器無法使用相機。請改用手機版 Safari 或 Chrome，並透過 HTTPS 網址開啟。";
      elements.permissionMessage.textContent = message;
      elements.permissionHelp.hidden = false;
      setCameraStatus(message, true);
      state.isStartingCamera = false;
      return;
    }

    stopCamera();

    try {
      state.stream = await requestCameraStream(state.facingMode);

      const activeVideoTrack = state.stream.getVideoTracks()[0];
      const activeFacingMode = activeVideoTrack?.getSettings?.().facingMode;
      if (activeFacingMode === "user" || activeFacingMode === "environment") {
        state.facingMode = activeFacingMode;
      }

      elements.cameraVideo.srcObject = state.stream;

      await new Promise((resolve) => {
        if (elements.cameraVideo.readyState >= 2) {
          resolve();
          return;
        }

        elements.cameraVideo.addEventListener("loadedmetadata", resolve, { once: true });
      });

      await elements.cameraVideo.play();

      elements.cameraStage.classList.toggle(
        "is-environment",
        state.facingMode === "environment",
      );

      setCameraStatus("", false);
      elements.captureButton.disabled = false;
    } catch (error) {
      console.error(error);
      const message = getCameraErrorMessage(error);
      elements.permissionMessage.textContent = message;
      elements.permissionHelp.hidden = false;
      setCameraStatus(message, true);
    } finally {
      state.isStartingCamera = false;
    }
  }

  function selectFrame(index) {
    if (!frames[index]) return;

    state.selectedFrameIndex = index;
    elements.frameOverlay.src = frames[index].src;

    elements.frameOptions.forEach((button, buttonIndex) => {
      const isSelected = buttonIndex === index;
      button.classList.toggle("is-selected", isSelected);
      button.setAttribute("aria-pressed", String(isSelected));
    });
  }

  function drawVideoCover(context, video, targetWidth, targetHeight, mirror) {
    const sourceWidth = video.videoWidth;
    const sourceHeight = video.videoHeight;

    if (!sourceWidth || !sourceHeight) {
      throw new Error("相機畫面尚未準備完成。");
    }

    const sourceRatio = sourceWidth / sourceHeight;
    const targetRatio = targetWidth / targetHeight;

    let cropX = 0;
    let cropY = 0;
    let cropWidth = sourceWidth;
    let cropHeight = sourceHeight;

    if (sourceRatio > targetRatio) {
      cropWidth = sourceHeight * targetRatio;
      cropX = (sourceWidth - cropWidth) / 2;
    } else {
      cropHeight = sourceWidth / targetRatio;
      cropY = (sourceHeight - cropHeight) / 2;
    }

    context.save();

    if (mirror) {
      context.translate(targetWidth, 0);
      context.scale(-1, 1);
    }

    context.drawImage(
      video,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      targetWidth,
      targetHeight,
    );

    context.restore();
  }

  function canvasToBlob(canvas, type = "image/jpeg", quality = 0.95) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("照片輸出失敗。"));
        }
      }, type, quality);
    });
  }

  function buildFilename() {
    const now = new Date();
    const pad = (value) => String(value).padStart(2, "0");

    return [
      "RASA",
      now.getFullYear(),
      pad(now.getMonth() + 1),
      pad(now.getDate()),
      "_",
      pad(now.getHours()),
      pad(now.getMinutes()),
      pad(now.getSeconds()),
      ".jpg",
    ].join("");
  }

  function clearResultObjectUrl() {
    if (state.resultObjectUrl) {
      URL.revokeObjectURL(state.resultObjectUrl);
      state.resultObjectUrl = "";
    }
  }

  async function capturePhoto() {
    if (elements.captureButton.disabled || !state.stream) return;

    elements.captureButton.disabled = true;
    elements.cameraStage.classList.remove("is-flashing");
    void elements.cameraStage.offsetWidth;
    elements.cameraStage.classList.add("is-flashing");

    try {
      const canvas = elements.captureCanvas;
      const context = canvas.getContext("2d", { alpha: false });

      canvas.width = FRAME_WIDTH;
      canvas.height = FRAME_HEIGHT;

      context.fillStyle = "#000";
      context.fillRect(0, 0, FRAME_WIDTH, FRAME_HEIGHT);

      drawVideoCover(
        context,
        elements.cameraVideo,
        FRAME_WIDTH,
        FRAME_HEIGHT,
        state.facingMode === "user",
      );

      const selectedFrame = state.frameImages[state.selectedFrameIndex];
      context.drawImage(selectedFrame, 0, 0, FRAME_WIDTH, FRAME_HEIGHT);

      state.capturedBlob = await canvasToBlob(canvas);
      clearResultObjectUrl();
      state.resultObjectUrl = URL.createObjectURL(state.capturedBlob);

      const filename = buildFilename();
      elements.resultImage.src = state.resultObjectUrl;
      elements.downloadButton.href = state.resultObjectUrl;
      elements.downloadButton.download = filename;

      const file = new File([state.capturedBlob], filename, {
        type: state.capturedBlob.type,
      });

      elements.shareButton.hidden = !(
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      );

      showScreen("result");
      stopCamera();
    } catch (error) {
      console.error(error);
      window.alert("照片處理失敗，請重新拍攝一次。");
      elements.captureButton.disabled = false;
    }
  }

  async function sharePhoto() {
    if (!state.capturedBlob) return;

    const filename = elements.downloadButton.download || buildFilename();
    const file = new File([state.capturedBlob], filename, {
      type: state.capturedBlob.type,
    });

    try {
      await navigator.share({
        files: [file],
        title: "RASA 線上拍貼機",
        text: "我的 RASA 拍貼照片",
      });
    } catch (error) {
      if (error?.name !== "AbortError") {
        console.error(error);
        window.alert("目前無法開啟分享選單，請改用「下載照片」。");
      }
    }
  }

  async function retakePhoto() {
    showScreen("camera");
    await startCamera();
  }

  async function switchCamera() {
    state.facingMode = state.facingMode === "user" ? "environment" : "user";
    await startCamera();
  }

  async function initialise() {
    try {
      await preloadFrames();
    } catch (error) {
      console.error(error);
      window.alert("套框素材讀取失敗，請重新整理頁面。");
    }

    elements.startButton.addEventListener("click", async () => {
      showScreen("camera");
      await startCamera();
    });

    elements.cameraSwitchButton.addEventListener("click", switchCamera);
    elements.captureButton.addEventListener("click", capturePhoto);
    elements.retryButton.addEventListener("click", startCamera);
    elements.shareButton.addEventListener("click", sharePhoto);
    elements.retakeButton.addEventListener("click", retakePhoto);

    elements.frameOptions.forEach((button) => {
      button.addEventListener("click", () => {
        selectFrame(Number(button.dataset.frameIndex));
      });
    });

    window.addEventListener("pagehide", () => {
      stopCamera();
      clearResultObjectUrl();
    });
  }

  initialise();
})();
