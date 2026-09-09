(function () {
    const gallerySelectors = [
        ".media-grid",
        ".ul-large-grid",
        ".ul-post-grid",
        ".ul-story-grid",
        ".ul-carousel-stage",
        ".ul-mockup-grid",
        ".wk-card-grid",
        ".wk-banner-grid",
        ".wk-wide-grid",
        ".wk-product-row",
        ".seo-large-grid",
        ".seo-banner-grid",
        ".seo-card-grid"
    ];

    let activeGallery = [];
    let activeIndex = 0;
    let startX = 0;
    let currentVideoTrigger = null;

    const imageModal = document.createElement("div");
    imageModal.className = "site-lightbox";
    imageModal.setAttribute("aria-hidden", "true");
    imageModal.innerHTML = `
        <button class="site-lightbox__close" type="button" aria-label="Close image">×</button>
        <button class="site-lightbox__prev" type="button" aria-label="Previous image">‹</button>
        <div class="site-lightbox__stage" role="dialog" aria-modal="true" aria-label="Image preview">
            <img class="site-lightbox__image" src="" alt="">
        </div>
        <button class="site-lightbox__next" type="button" aria-label="Next image">›</button>
        <span class="site-lightbox__counter" aria-live="polite"></span>
        <span class="site-lightbox__hint">ESC to close</span>
    `;

    const videoModal = document.createElement("div");
    videoModal.className = "site-video-modal";
    videoModal.setAttribute("aria-hidden", "true");
    videoModal.innerHTML = `
        <button class="site-video-modal__close" type="button" aria-label="Close video">×</button>
        <div class="site-video-modal__stage" role="dialog" aria-modal="true" aria-label="Video player">
            <video controls playsinline></video>
        </div>
        <span class="site-video-modal__label">Video Preview</span>
    `;

    document.body.append(imageModal, videoModal);

    const lightboxImage = imageModal.querySelector(".site-lightbox__image");
    const imageCounter = imageModal.querySelector(".site-lightbox__counter");
    const closeImageButton = imageModal.querySelector(".site-lightbox__close");
    const prevButton = imageModal.querySelector(".site-lightbox__prev");
    const nextButton = imageModal.querySelector(".site-lightbox__next");
    const closeVideoButton = videoModal.querySelector(".site-video-modal__close");
    const modalVideo = videoModal.querySelector("video");

    function getImageSource(image) {
        return image.currentSrc || image.src || "";
    }

    function getImageGroup(image) {
        if (image.closest("a")) return [];

        const container = image.closest(gallerySelectors.join(","));
        if (container) {
            return Array.from(container.querySelectorAll("img")).filter((item) => !item.closest("[data-video]"));
        }

        const section = image.closest("section");
        if (!section || image.closest(".navbar, footer, .footer, .logo, .work-hero, .hero")) return [];

        const images = Array.from(section.querySelectorAll("img")).filter((item) => {
            return !item.closest(".navbar, footer, .footer, .logo, [data-video]");
        });

        return images.length > 1 ? images : [];
    }

    function setLock(isLocked) {
        document.body.classList.toggle("lb-lock", isLocked);
    }

    function renderImage() {
        const image = activeGallery[activeIndex];
        if (!image) return;

        lightboxImage.src = getImageSource(image);
        lightboxImage.alt = image.alt || "Portfolio gallery image";
        imageCounter.textContent = `${activeIndex + 1} / ${activeGallery.length}`;
        prevButton.style.display = activeGallery.length > 1 ? "" : "none";
        nextButton.style.display = activeGallery.length > 1 ? "" : "none";
    }

    function openImage(image) {
        activeGallery = getImageGroup(image);
        if (!activeGallery.length) return;

        activeIndex = Math.max(0, activeGallery.indexOf(image));
        renderImage();
        imageModal.classList.add("is-open");
        imageModal.setAttribute("aria-hidden", "false");
        setLock(true);
        closeImageButton.focus({ preventScroll: true });
    }

    function closeImage() {
        imageModal.classList.remove("is-open");
        imageModal.setAttribute("aria-hidden", "true");
        lightboxImage.removeAttribute("src");
        activeGallery = [];
        setLock(videoModal.classList.contains("is-open"));
    }

    function showImage(offset) {
        if (!activeGallery.length) return;
        activeIndex = (activeIndex + offset + activeGallery.length) % activeGallery.length;
        renderImage();
    }

    function openVideo(trigger) {
        const source = trigger.dataset.video || trigger.getAttribute("href");
        if (!source) return;

        currentVideoTrigger = trigger;
        modalVideo.src = source;
        modalVideo.poster = trigger.dataset.poster || trigger.poster || trigger.querySelector("img")?.src || "";
        videoModal.classList.add("is-open");
        videoModal.setAttribute("aria-hidden", "false");
        setLock(true);
        closeVideoButton.focus({ preventScroll: true });
        modalVideo.play().catch(() => {});
    }

    function closeVideo() {
        videoModal.classList.remove("is-open");
        videoModal.setAttribute("aria-hidden", "true");
        modalVideo.pause();
        modalVideo.removeAttribute("src");
        modalVideo.load();
        setLock(imageModal.classList.contains("is-open"));
        currentVideoTrigger?.focus?.({ preventScroll: true });
        currentVideoTrigger = null;
    }

    function prepareGalleries() {
        gallerySelectors.forEach((selector) => {
            document.querySelectorAll(selector).forEach((gallery) => {
                const images = Array.from(gallery.querySelectorAll("img")).filter((image) => !image.closest("[data-video]"));
                if (images.length) {
                    gallery.classList.add("lb-gallery-ready");
                    images.forEach((image) => image.setAttribute("tabindex", "0"));
                }
            });
        });
    }

    prepareGalleries();

    function prepareVideos() {
        let fallbackIndex = 1;

        document.querySelectorAll("video").forEach((video) => {
            if (!video.dataset.video && !video.getAttribute("src") && !video.querySelector("source[src]")) {
                video.dataset.video = `assets/videos/video${fallbackIndex}.mp4`;
                fallbackIndex += 1;
            }
        });
    }

    prepareVideos();

    document.addEventListener("click", (event) => {
        const videoTrigger = event.target.closest("[data-video]");
        if (videoTrigger) {
            event.preventDefault();
            openVideo(videoTrigger);
            return;
        }

        const image = event.target.closest("img");
        if (image && getImageGroup(image).length) {
            event.preventDefault();
            openImage(image);
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            if (imageModal.classList.contains("is-open")) closeImage();
            if (videoModal.classList.contains("is-open")) closeVideo();
        }

        if (!imageModal.classList.contains("is-open")) return;

        if (event.key === "ArrowLeft") showImage(-1);
        if (event.key === "ArrowRight") showImage(1);
    });

    document.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        const image = event.target.closest?.("img");
        if (image && getImageGroup(image).length) {
            event.preventDefault();
            openImage(image);
        }
    });

    closeImageButton.addEventListener("click", closeImage);
    prevButton.addEventListener("click", () => showImage(-1));
    nextButton.addEventListener("click", () => showImage(1));
    closeVideoButton.addEventListener("click", closeVideo);

    imageModal.addEventListener("click", (event) => {
        if (event.target === imageModal) closeImage();
    });

    videoModal.addEventListener("click", (event) => {
        if (event.target === videoModal) closeVideo();
    });

    imageModal.addEventListener("touchstart", (event) => {
        startX = event.changedTouches[0].clientX;
    }, { passive: true });

    imageModal.addEventListener("touchend", (event) => {
        const endX = event.changedTouches[0].clientX;
        const distance = endX - startX;
        if (Math.abs(distance) < 48) return;
        showImage(distance > 0 ? -1 : 1);
    }, { passive: true });
})();
