const axios = require("axios");
const http = require("http");
const https = require("https");

// 非同步函式，用於測試代理伺服器
async function testProxy(proxyUrl, targetUrl) {
	try {
		// 輸出代理伺服器和目標 URL
		console.log("Proxy URL:", proxyUrl.href);
		console.log("Target URL:", targetUrl);

		// 使用 axios 發送 GET 請求
		const response = await axios.get(targetUrl, {
			headers: {
				// 設定 User-Agent 標頭
				"User-Agent":
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
			},
			proxy: {
				// 設定代理伺服器的主機名、端口和協議
				host: proxyUrl.hostname,
				port: proxyUrl.port,
				protocol: proxyUrl.protocol,
			},
			// 設定 HTTP 和 HTTPS 代理
			httpAgent: new http.Agent({
				keepAlive: true,
			}),
			httpsAgent: new https.Agent({
				keepAlive: true,
			}),
		});
		// 輸出回應狀態和數據
		console.log("Response Status:", response.status);
		console.log("Response Data:", response.data);
	} catch (error) {
		// 捕獲並輸出錯誤
		console.error("Error:", error.message);
		if (error.response) {
			// 如果有回應，輸出回應狀態和數據
			console.error("Response Status:", error.response.status);
			console.error("Response Data:", error.response.data);
		}
	}
}

// 代理伺服器地址
const proxyUrl = new URL("http://localhost:8080");

// 目標 URL
const targetUrl = "https://www.google.com/";

// 呼叫測試代理伺服器的函式
testProxy(proxyUrl, targetUrl);
