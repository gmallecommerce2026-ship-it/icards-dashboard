import { v4 as uuidv4 } from 'uuid';

export const CANVAS_WIDTH = 454;
export const CANVAS_HEIGHT = 605;

export const DEFAULT_SETTINGS = {
  eventDate: "", groomName: "", brideName: "",
  events: [], participants: [], loveStory: [],
  blocksOrder: [
    "BANNER_CAROUSEL", "EVENT_DESCRIPTION", "COUPLE_INFO", 
    "PARTICIPANTS", "EVENT_SCHEDULE", "COUNTDOWN", 
    "LOVE_STORY", "GALLERY", "VIDEO", "CONTACT_INFO", 
    "QR_CODES", "RSVP", "CUSTOM_HTML"
  ],
  countdownTitle: "Sự kiện trọng đại sẽ diễn ra trong",
  coupleTitle: "Cô Dâu & Chú Rể",
  // ... (Paste toàn bộ block "settings" rỗng từ JSON của bạn vào đây)
};

export const createNewPage = (pageNumber) => ({
  id: uuidv4(),
  name: `Trang ${pageNumber}`,
  items: [],
  backgroundColor: "#FFFFFF",
  backgroundImage: "",
  canvasWidth: CANVAS_WIDTH,
  canvasHeight: CANVAS_HEIGHT
});