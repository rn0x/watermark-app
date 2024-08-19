// CustomNotification.jsx
import React, { useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

/**
 * CustomNotification هو مكون React يعرض إشعارًا قابلًا للتخصيص باستخدام مكتبة react-toastify.
 * 
 * @param {Object} props - الخصائص التي يتم تمريرها إلى المكون.
 * @param {string} props.message - رسالة الإشعار.
 * @param {string} [props.type='success'] - نوع الإشعار (مثل 'success', 'error', 'warning', 'info').
 * 
 * @returns {JSX.Element} - مكون يحتوي على ToastContainer لعرض الإشعارات.
 */
const CustomNotification = ({ message, type = 'success' }) => {
  /**
   * عرض الإشعار باستخدام مكتبة react-toastify.
   * يعرض إشعارًا مع المحتوى والأنواع المخصصة.
   */
  const showNotification = () => {
    try {
      toast[type](message, {
        position: "top-center",
        autoClose: 5000,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        hideProgressBar: false,
        pauseOnFocusLoss: true,
        theme: "light",
        rtl: true,
      });
    } catch (error) {
      console.error('Error displaying notification:', error);
    }
  };

  // عرض الإشعار عند تحميل المكون
  useEffect(() => {
    showNotification();
  }, [message, type]);

  return <ToastContainer />;
};

export default CustomNotification;