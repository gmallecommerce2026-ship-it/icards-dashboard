// AdminFE/Pages/InvitationDesign/utils.js
import { v4 as uuidv4 } from 'uuid';

const defaultItemProps = {
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    brightness: 1,
    contrast: 1,
    grayscale: 0,
    fontWeight: 'normal',
    fontStyle: 'normal',
    textDecoration: 'none',
    textAlign: 'center',
};

export const processTemplate = (templateData) => {
    if (!templateData || !templateData.pages) return [];
    return templateData.pages.map(page => ({
        ...page,
        id: uuidv4(),
        canvasWidth: templateData.width || page.canvasWidth,
        canvasHeight: templateData.height || page.canvasHeight,
        items: page.items.map(item => ({
            ...defaultItemProps,
            ...item,
            id: uuidv4(),
        }))
    }));
};