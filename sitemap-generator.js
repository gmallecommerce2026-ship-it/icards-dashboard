/**
 * Kịch bản này tạo ra tệp sitemap.xml cho ứng dụng React của bạn.
 * Nó tìm nạp các đường dẫn động (sản phẩm, mẫu thiệp) từ API của bạn
 * và kết hợp chúng với các đường dẫn tĩnh để tạo ra một sơ đồ trang web hoàn chỉnh.
 *
 * CÁCH SỬ DỤNG:
 * 1. Đặt tệp này ở thư mục gốc của dự án frontend.
 * 2. Cài đặt các gói cần thiết: npm install axios sitemap chalk
 * 3. Cập nhật các biến API_BASE_URL và YOUR_DOMAIN bên dưới.
 * 4. Chạy kịch bản này trước khi build: node sitemap-generator.js
 * 5. Thêm vào package.json: "build": "node sitemap-generator.js && react-scripts build"
 */

const { SitemapStream, streamToPromise } = require('sitemap');
const { createWriteStream } = require('fs');
const axios = require('axios');
const chalk = require('chalk');

// --- CẤU HÌNH ---
const API_BASE_URL = 'http://localhost:5000/api/v1'; // << THAY ĐỔI URL API CỦA BẠN
const YOUR_DOMAIN = 'https://your-domain.com';      // << THAY ĐỔI TÊN MIỀN CỦA BẠN

const fetchApiData = async (endpoint) => {
    try {
        console.log(chalk.blue(`Đang tìm nạp dữ liệu từ: ${API_BASE_URL}${endpoint}`));
        const response = await axios.get(`${API_BASE_URL}${endpoint}`);
        console.log(chalk.green(`  -> Tìm thấy ${response.data.data.length} mục.`));
        return response.data.data;
    } catch (error) {
        console.error(chalk.red(`Lỗi khi tìm nạp ${endpoint}:`), error.message);
        return [];
    }
};

async function generateSitemap() {
    console.log(chalk.cyan('Bắt đầu tạo sitemap...'));

    const sitemapStream = new SitemapStream({ hostname: YOUR_DOMAIN });
    const writeStream = createWriteStream('./public/sitemap.xml');
    sitemapStream.pipe(writeStream);

    // 1. Thêm các đường dẫn tĩnh
    const staticRoutes = [
        { url: '/', changefreq: 'daily', priority: 1.0 },
        { url: '/shop', changefreq: 'weekly', priority: 0.8 },
        { url: '/invitations', changefreq: 'weekly', priority: 0.8 },
        { url: '/about-us', changefreq: 'monthly', priority: 0.5 },
        { url: '/policies-and-privacy', changefreq: 'monthly', priority: 0.5 },
        { url: '/tutorial', changefreq: 'monthly', priority: 0.5 },
    ];
    console.log(chalk.blue('Thêm các đường dẫn tĩnh...'));
    staticRoutes.forEach(route => sitemapStream.write(route));

    // 2. Tìm nạp và thêm các đường dẫn sản phẩm
    const products = await fetchApiData('/products');
    products.forEach(product => {
        sitemapStream.write({
            url: `/product/${product._id}`,
            changefreq: 'weekly',
            priority: 0.9,
            // lastmod: product.updatedAt, // Thêm nếu API của bạn cung cấp
        });
    });

    // 3. Tìm nạp và thêm các đường dẫn mẫu thiệp mời
    const templates = await fetchApiData('/invitation-templates');
    templates.forEach(template => {
        sitemapStream.write({
            url: `/invitation/${template._id}`,
            changefreq: 'weekly',
            priority: 0.9,
            // lastmod: template.updatedAt,
        });
    });

    // 4. Tìm nạp và thêm các đường dẫn sự kiện công khai (nếu có)
    // Giả sử bạn có một endpoint để lấy tất cả các sự kiện công khai
    // const events = await fetchApiData('/invitations/public');
    // events.forEach(event => {
    //     sitemapStream.write({
    //         url: `/events/${event._id}`,
    //         changefreq: 'yearly',
    //         priority: 0.7,
    //     });
    // });
    
    sitemapStream.end();
    await new Promise((resolve) => writeStream.on('finish', resolve));

    console.log(chalk.cyan.bold('Tạo sitemap.xml thành công! Tệp đã được lưu tại ./public/sitemap.xml'));
}

generateSitemap();
