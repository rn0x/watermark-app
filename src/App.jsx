import React, { useState, useCallback, useEffect } from 'react';
import { Canvas, Image as FabricImage } from 'fabric';
import { Helmet } from 'react-helmet-async';
import { FaTrashAlt, FaDownload, FaSpinner, FaLanguage, FaTelegramPlane, FaPhoneAlt, FaGlobe, FaWhatsapp } from 'react-icons/fa';
import { saveImage } from './FileUtils.js';
import CustomNotification from './CustomNotification.jsx'
import styles from './App.module.css';
import locales from './locales';

function App() {
  const [notification, setNotification] = useState(null);
  const [images, setImages] = useState([]);
  const [watermarkedImages, setWatermarkedImages] = useState([]);
  const [watermarkImage, setWatermarkImage] = useState(null);
  const [error, setError] = useState('');
  const [watermarkPosition, setWatermarkPosition] = useState('bottom-right');
  const [watermarkSize, setWatermarkSize] = useState(20); // Size as a percentage
  const [isLoading, setIsLoading] = useState(false);
  const deviceLanguage = (window.navigator.language || window.navigator.userLanguage).toLowerCase();
  const defaultLang = deviceLanguage.includes('ar') ? 'ar' : 'en';
  const [lang, setLang] = useState(localStorage.getItem('lang') || defaultLang);

  const texts = locales[lang] || locales[defaultLang];
  const dir = lang === "en" ? "ltr" : "rtl";

  useEffect(() => {
    localStorage.setItem('lang', lang);
  }, [lang]);

  const isCordova = () => window.cordova !== undefined;

  const openSystem = (url) => {
    if (window.cordova) {
      window.cordova.InAppBrowser.open(url, "_system");
    } else {
      window.open(url, "_blank");
    }
  };

  const selectImages = () => {
    if (isCordova()) {
      window.navigator.camera.getPicture(
        (imageUri) => {
          const imageObj = {
            file: imageUri,
            preview: imageUri,
          };
          setImages((prevImages) => [...prevImages, imageObj]);
          setWatermarkedImages([]);
          setError('');
          console.log("prevImages: ", imageObj);
        },
        (err) => {
          setError(`${texts.error || 'Error'}: ${err}`);
        },
        {
          quality: 100,
          destinationType: window.navigator.camera.DestinationType.DATA_URL,
          sourceType: window.navigator.camera.PictureSourceType.PHOTOLIBRARY,
          mediaType: window.navigator.camera.MediaType.PICTURE,
        }
      );
    } else {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*';
      fileInput.multiple = true;
      fileInput.onchange = (event) => {
        const files = event.target.files;
        const newImages = Array.from(files).map((file) => ({
          file,
          preview: URL.createObjectURL(file),
        }));
        setImages((prevImages) => [...prevImages, ...newImages]);
        setWatermarkedImages([]);
        setError('');
      };
      fileInput.click();
    }
  };

  const selectWatermark = () => {
    if (isCordova()) {
      navigator.camera.getPicture(
        (imageUri) => {
          setWatermarkImage(imageUri);
          setError('');
        },
        (err) => {
          setError(`${texts.error || 'Error'}: ${err}`);
        },
        {
          quality: 100,
          destinationType: navigator.camera.DestinationType.DATA_URL,
          sourceType: navigator.camera.PictureSourceType.PHOTOLIBRARY,
          mediaType: navigator.camera.MediaType.PICTURE,
        }
      );
    } else {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*';
      fileInput.onchange = (event) => {
        const file = event.target.files[0];
        setWatermarkImage(URL.createObjectURL(file));
        setError('');
      };
      fileInput.click();
    }
  };

  const updateWatermark = useCallback(() => {
    if (images.length === 0) {
      setError(texts.noImages || 'No images uploaded');
      return;
    }
    if (!watermarkImage) {
      setError(texts.noWatermark || 'No watermark image uploaded');
      return;
    }

    setIsLoading(true);

    const newWatermarkedImages = [];

    images.forEach(async (imageObj) => {
      const canvas = new Canvas();
      const imgElement = new Image();
      imgElement.src = isCordova() ? "data:image/jpeg;base64," + imageObj.preview : imageObj.preview;

      imgElement.onload = () => {
        const img = new FabricImage(imgElement);
        canvas.setWidth(imgElement.width);
        canvas.setHeight(imgElement.height);
        canvas.add(img);

        const watermarkElement = new Image();
        watermarkElement.src = isCordova() ? "data:image/jpeg;base64," + watermarkImage : watermarkImage;
        watermarkElement.onload = () => {
          const watermarkWidth = watermarkElement.width * (watermarkSize / 100);
          const watermarkHeight = watermarkElement.height * (watermarkSize / 100);

          let left, top;
          switch (watermarkPosition) {
            case 'bottom-left':
              left = 20;
              top = imgElement.height - watermarkHeight - 20;
              break;
            case 'bottom-right':
              left = imgElement.width - watermarkWidth - 20;
              top = imgElement.height - watermarkHeight - 20;
              break;
            case 'top-left':
              left = 20;
              top = 20;
              break;
            case 'top-right':
              left = imgElement.width - watermarkWidth - 20;
              top = 20;
              break;
            case 'center':
              left = (imgElement.width - watermarkWidth) / 2;
              top = (imgElement.height - watermarkHeight) / 2;
              break;
            default:
              left = imgElement.width - watermarkWidth - 20;
              top = imgElement.height - watermarkHeight - 20;
          }

          const watermark = new FabricImage(watermarkElement, {
            left,
            top,
            scaleX: watermarkSize / 100,
            scaleY: watermarkSize / 100,
            opacity: 0.5,
          });
          canvas.add(watermark);

          const watermarkedImage = canvas.toDataURL({
            format: 'png',
            quality: 1,
          });

          newWatermarkedImages.push({
            ...imageObj,
            watermarkedImage,
          });

          if (newWatermarkedImages.length === images.length) {
            setWatermarkedImages(newWatermarkedImages);
            setIsLoading(false);
            setError('');
          }
        };

        watermarkElement.onerror = (err) => {
          console.error('Error loading image watermark:', err);
          setError(texts.watermarkError || 'Error loading watermark image');
          setIsLoading(false);
        };
      };

      imgElement.onerror = (err) => {
        console.error('Error loading image:', err);
        setError(texts.imageError || 'Error loading uploaded image');
        setIsLoading(false);
      };
    });
  }, [images, watermarkImage, watermarkPosition, watermarkSize, texts]);

  const handlePositionChange = (position) => {
    setWatermarkPosition(position);
  };

  const handleSizeChange = (e) => {
    setWatermarkSize(parseFloat(e.target.value));
  };

  return (
    <div dir={dir} className={styles.container}>
      <Helmet>
        <title>{texts.title || 'Watermark App'}</title>
        <meta name="description" content={texts.description || 'Add watermark to images.'} />
        <meta name="keywords" content={texts.keywords || 'watermark, images, app'} />
      </Helmet>

      <h1 className={styles.title}>{texts.titleh1 || 'Watermark App'}</h1>

      <div className={styles.languageSelector}>
        {lang === 'ar' ? (
          <button onClick={() => setLang('en')} className={styles.languageButton}>
            <FaLanguage /> <span>{texts.english || 'English'}</span>
          </button>
        ) : (
          <button onClick={() => setLang('ar')} className={styles.languageButton}>
            <FaLanguage /> <span>{texts.arabic || 'Arabic'}</span>
          </button>
        )}
      </div>

      <div className={styles.controls}>
        <button onClick={selectImages} className={styles.button}>
          {texts.selectImages || 'Select Images'}
        </button>
        <button onClick={selectWatermark} className={styles.button}>
          {texts.selectWatermark || 'Select Watermark'}
        </button>
        {
          images.length > 0 &&
          (
            <button onClick={() => { setImages([]); setWatermarkedImages([]); }} className={styles.button} style={{ background: "#dc3545" }}>
              {texts.clearAll || 'Clear All'}
            </button>
          )
        }
      </div>

      {error && <div className={styles.errorMessage}>{error}</div>}

      {images.length > 0 && (
        <div className={styles.settings}>
          <label className={styles.label}>
            {texts.watermarkPosition || 'Watermark Position'}:
            <select value={watermarkPosition} onChange={(e) => handlePositionChange(e.target.value)} className={styles.select}>
              <option value="bottom-left">{texts.bottomLeft || 'Bottom Left'}</option>
              <option value="bottom-right">{texts.bottomRight || 'Bottom Right'}</option>
              <option value="top-left">{texts.topLeft || 'Top Left'}</option>
              <option value="top-right">{texts.topRight || 'Top Right'}</option>
              <option value="center">{texts.center || 'Center'}</option>
            </select>
          </label>
          <label className={styles.label}>
            {texts.watermarkSize || 'Watermark Size (%)'}:
            <input
              type="number"
              value={watermarkSize}
              onChange={handleSizeChange}
              min="10"
              max="100"
              className={styles.input}
            />
          </label>
          <button onClick={updateWatermark} className={styles.button} style={{ padding: "5px 5px", width: "150px" }}>
            {isLoading ? <FaSpinner className={styles.spinner} /> : texts.applyWatermark || 'Apply Watermark'}
          </button>
        </div>
      )}

      {watermarkedImages.length > 0 && (
        <div className={styles.results}>
          {watermarkedImages.map((imgObj, index) => (
            <div key={index} className={styles.resultItem}>
              <img src={imgObj.watermarkedImage} alt={`Watermarked ${index}`} className={styles.resultImage} />
              <button onClick={async () => {

                if (isCordova()) {

                  const blob = await fetch(imgObj.watermarkedImage).then(res => res.blob());
                  saveImage(`watermarked_${index}.png`, blob);
                } else {
                  // For non-Cordova environments
                  const link = document.createElement('a');
                  link.href = imgObj.watermarkedImage;
                  link.download = `watermarked_${index}.png`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }
                setNotification({
                  message: texts.savedImageNotification,
                  type: 'success'
                });
              }} className={styles.button} style={{ padding: "5px 5px", width: "110px" }}>
                <FaDownload /> {texts.download || 'Download'}
              </button>
            </div>
          ))}
        </div>
      )}

      {notification && (
        <CustomNotification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      <div className={styles.contactSection} >
        <div
          className={styles.contactLink}
          onClick={() => openSystem("https://t.me/i8xApp")}
        >
          <FaTelegramPlane className={styles.contactIcon} />
          <span>Telegram: @i8xApp</span>
        </div>

        <div
          className={styles.contactLink}
          onClick={() => openSystem("https://i8x.net")}
        >
          <FaGlobe className={styles.contactIcon} />
          <span>Website: i8x.net</span>
        </div>

        <div
          className={styles.contactLink}
          onClick={() => openSystem("https://wa.me/966553556010")}
        >
          <FaWhatsapp className={styles.contactIcon} />
          <span>WhatsApp: +966553556010</span>
        </div>
      </div>


      <div className={styles.footer}>
        <p className={styles.footerText}>
          &copy; {new Date().getFullYear()} Watermark App. {texts.rightsReserved || 'All rights reserved.'}
        </p>
        <p className={styles.footerText}>
          {texts.contactInfo || 'For support or inquiries, contact us at: support@example.com'}
        </p>
      </div>

    </div>
  );
}

export default App;
