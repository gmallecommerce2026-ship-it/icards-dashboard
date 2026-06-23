// Utils/templateParser.js

/**
 * Hàm nội suy biến vào chuỗi văn bản
 * @param {string} text - Chuỗi văn bản gốc chứa placeholder (vd: "Kính mời: {{guest_name}}")
 * @param {object} guestData - Dữ liệu khách mời (vd: { guest_name: "Anh Tuấn", guest_title: "Chú" })
 * @returns {string} - Chuỗi đã được thay thế tên
 */
export const parseTemplateText = (text, guestData) => {
  if (!text || typeof text !== 'string') return text;
  if (!guestData) return text; // Nếu không có khách mời để preview, giữ nguyên placeholder hoặc để trống

  return text.replace(/\{\{(.*?)\}\}/g, (match, key) => {
    const dataKey = key.trim();
    return guestData[dataKey] !== undefined ? guestData[dataKey] : match;
  });
};

/**
 * Hàm duyệt qua toàn bộ cấu trúc thiết kế (JSON) để dịch các text node
 */
export const renderDesignWithGuest = (rawDesignElements, guestData) => {
  // Giả sử rawDesignElements là một mảng các layer/element của Invitation
  return rawDesignElements.map(element => {
    if (element.type === 'text' && element.content) {
      return {
        ...element,
        content: parseTemplateText(element.content, guestData)
      };
    }
    // Nếu có các element group (chứa children), cần gọi đệ quy ở đây
    return element;
  });
};