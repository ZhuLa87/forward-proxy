require("dotenv").config(); // 載入 dotenv 套件並配置環境變數

const net = require("net"); // 引入 net 模組，用於建立網路伺服器
const app = net.createServer(); // 建立一個 TCP 伺服器

const PORT = process.env.PORT; // 從環境變數中取得 PORT

// 從環境變數中取得 ALLOWED_IPS 並解析為陣列
const allowedIPs = process.env.ALLOWED_IPS
	? process.env.ALLOWED_IPS.split(",")
	: [];

// 當有新的連線時觸發
app.on("connection", async (clientToProxySocket) => {
	const clientAddress = clientToProxySocket.remoteAddress;
	console.log(`New connection from ${clientAddress}`); // 紀錄新連線的 IP

	// 檢查 IP 是否在允許的列表中
	if (allowedIPs.length === 0) {
		// 若為空列表，則允許所有 IP 連線
	} else if (!allowedIPs.includes(clientAddress)) {
		console.log("Connection from", clientAddress, "rejected."); // 記錄被拒絕的連線
		clientToProxySocket.end(); // 關閉連線
		return; // 結束處理
	}

	// 當接收到來自客戶端的第一筆資料時觸發
	clientToProxySocket.once("data", async (data) => {
		// 將接收到的資料轉換為 UTF-8 編碼的字串
		let dataString = data.toString("utf8");
		console.log(dataString.toString()); // 輸出接收到的資料
		let isConnectionTLS = dataString.toString().indexOf("CONNECT") !== -1; // 判斷是否為 TLS 連線

		let serverPort;
		let serverAddress;

		if (isConnectionTLS) {
			serverPort = 443; // 如果是 TLS 連線，使用 443 埠
			serverAddress = dataString.toString().split(" ")[1].split(":")[0]; // 解析伺服器地址
		} else {
			serverPort = 80; // 如果不是 TLS 連線，使用 80 埠
			serverAddress = dataString
				.toString()
				.toLowerCase()
				.split("host: ")[1]
				.split("\n")[0]
				.trim(); // 解析伺服器地址
		}

		// 建立與目標伺服器的連線
		let proxyToServerSocket = net.createConnection(
			{
				host: serverAddress,
				port: serverPort,
			},
			() => {
				console.log("Connected to the server"); // 連線成功後輸出訊息
			}
		);

		// 處理 proxyToServerSocket 的錯誤事件
		proxyToServerSocket.on("error", (err) => {
			console.error("Proxy to Server Socket Error:", err);
		});

		if (isConnectionTLS) {
			clientToProxySocket.write("HTTP/1.1 200 OK\r\n\n"); // 回應客戶端連線成功
		} else {
			proxyToServerSocket.write(dataString); // 將資料轉發給伺服器
		}

		// 將客戶端與伺服器的資料流互相連接
		clientToProxySocket.pipe(proxyToServerSocket);
		proxyToServerSocket.pipe(clientToProxySocket);
	});
});

app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
