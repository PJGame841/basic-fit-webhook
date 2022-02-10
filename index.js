import dotenv from "dotenv";
dotenv.config();

import express from "express";
import fetch from "node-fetch";

const app = express();

const setResponse = (res, code, data) => {
	return res.status(code).send(JSON.stringify(data));
};

const myFavoriteClub = {
	name: "Saint-Clément-de-Rivière Impasse des Églantiers",
	id: "ccefea76-8277-4141-b9e2-ff15fd94b0e5",
	country: "France",
	bookable: true,
	status: null,
	debt_check: false,
	label_name: "1452",
	longitude: 3.85049,
	latitude: 43.65071,
	blocked_countries: null,
	mbf_payment_page_disabled__c: false,
	rules_label: "1347",
	terms_label: "1456",
};

const getHeaders = (origin, path) => {
	// example origin: /gym-time-booking || example path: /door-policy/book-door-policy
	return {
		"content-type": "application/json",
		"Accept-Encoding": "gzip, deflate, br",
		Connection: "keep-alive",
		"mbf-rct-app-api-2-caller": true,
		origin: "https://my.basic-fit.com",
		referer: "https://my.basic-fit.com" + origin,
		"user-agent":
			"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.82 Safari/537.36",
		accept: "application/json, text/plain, */*",
		"accept-language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
		"sec-ch-ua":
			'" Not A;Brand";v="99", "Chromium";v="98", "Google Chrome";v="98"',
		"sec-ch-ua-mobile": "?0",
		"sec-ch-ua-platform": '"Windows"',
		"sec-fetch-dest": "empty",
		"sec-fetch-mode": "cors",
		"sec-fetch-site": "same-origin",
		authority: "my.basic-fit.com",
		method: "POST",
		path: path,
		scheme: "https",
	};
};

const getDate = () => {
	// get the next quarter
	process.env.TZ = "Europe/Paris"; // set timezone
	const time = new Date();

	time.setSeconds(0, 0);
	let newMinutes = Math.round(time.getMinutes() / 15) * 15; // get the next quarter

	if (newMinutes - time.getMinutes() < 5) {
		// if next quarter is less than 5 minutes away, add another quarter
		newMinutes += 15;
	}
	newMinutes -= time.getTimezoneOffset(); // returned time is in UTC, so add timezone offset
	time.setMinutes(newMinutes);

	const str = time.toISOString();
	return str.substring(0, str.length - 1);
};

const cookieParser = (cookies) => {
	let str = "";

	cookies.forEach((cookie) => {
		str += cookie.substring(0, cookie.indexOf(";") + 1) + " ";
	});

	return str;
};

app.get("/make-reservation", async (req, res) => {
	const { specialCode, sessionId } = req.query;

	console.log("Received new booking request");

	if (!specialCode || specialCode != process.env.APP_SPECIALCODE) {
		// Just a simple check to make sure it's me
		return setResponse(res, 401, {
			booked: false,
			message: "Wrong special code !",
		});
	}

	console.log("Booking request authorized !");
	console.log("Logging to Basic-fit...");
	let cookies;
	if (!sessionId) {
		const loginBody = JSON.stringify({
			email: process.env.APP_BASICFITMAIL,
			password: process.env.APP_BASICFITPASSWORD,
			cardNumber: "",
		});
		const loginHeaders = getHeaders("/login", "/authentication/login");
		loginHeaders.mbfloginheadvform = "jk#Bea201";
		const loginResponse = await fetch(
			"https://my.basic-fit.com/authentication/login",
			{ method: "POST", body: loginBody, headers: loginHeaders }
		);

		console.log("Logged in ! Formatting...");

		const loginData = await loginResponse.json();

		if (!loginData.member) {
			return setResponse(res, 400, {
				booked: false,
				message: loginData.message,
			});
		}
		cookies = loginResponse.headers.getAll("set-cookie");
	} else {
		cookies = [`connect.sid=${sessionId};`];
	}

	console.log("Logged to Basic-fit !");
	console.log("Sending booking to Basic-fit...");

	const bookBody = JSON.stringify({
		doorPolicy: {
			doorPolicyId: "606f1e70-800a-4881-969f-dbd7702c4172",
			startDateTime: getDate(),
			openForReservation: true,
			lastSlot: false,
		},
		duration: "90",
		clubOfChoice: loginData
			? loginData.member["favorite_club"]
			: myFavoriteClub,
	});
	const bookHeaders = getHeaders(
		"/gym-time-booking",
		"/door-policy/book-door-policy"
	);
	bookHeaders.Cookie = cookieParser(cookies);
	const bookResponse = await fetch(
		"https://my.basic-fit.com/door-policy/book-door-policy",
		{ method: "POST", body: bookBody, headers: bookHeaders }
	);

	const bookData = await bookResponse.json();

	if (!bookData.message || bookData.message != "Booked") {
		console.log("Booking error", bookResponse.status, bookData);
		return setResponse(res, 400, {
			booked: false,
			message: bookData.message || "Error while booking !",
		});
	}

	console.log("Booking done !");

	setResponse(res, 200, { booked: true });
});

app.get("/test", (req, res) => {
	res.send(getDate());
});

app.listen(process.env.PORT || 3000, () => {
	console.log("Listening on http://localhost:" + (process.env.PORT || 3000));
});
