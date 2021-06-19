const request = require('request');
const cheerio = require('cheerio');
const readline = require('readline');
const fs = require('fs');

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

// Начальные категории
// let categories = {
// 	"продавец": [0, "продавец"],
// 	"разнорабочий": [0, "разнорабочий", "разнорабоч", "рабоч"],
// 	"преподаватель": [0, "преподаватель", "преподавател"],
// 	"секретарь": [0, "секретарь", "секретар"],
// 	"экономист": [0, "экономист"],
// 	"барбер": [0, "барбер"],
// 	"уборщица": [0, "уборщица", "уборщиц", "техничка", "техничк"],
// 	"посудомойщица": [0, "посудомойщица", "посудомойщиц", "посудниц"],
// 	"водитель": [0, "водитель", "водител"],
// 	"врач": [0, "врач", "мед сестр", "медицинской сестры"],
// 	"шашлычник": [0, "шашлычник"],
// 	"консультант": [0, "консультант"],
// 	"повар": [0, "повар"],
// 	"официант": [0, "официант"],
// 	"администратор": [0, "администратор"],
// 	"оператор": [0, "оператор"],
// 	"кассир": [0, "кассир"],
// 	"менеджер": [0, "менеджер"],
// 	"директор": [0, "директор"],
// 	"шаурмист": [0, "шаурмист"],
// 	"плиточник": [0, "плиточник"],
// 	"фармацевт": [0, "фармацевт"],
// 	"охранник": [0, "охранник"],
// 	"кондитер": [0, "кондитер"],
// 	"грузчик": [0, "грузчик"],
// };

// Категории из файла
let categories = JSON.parse(fs.readFileSync("statistics.txt", "utf8"));

// let categories;

let trash = ["требуется", "требуются", "ассаламу алейкум", "работа", "срочно", "ищу", "ищем", "ишем", " "];
let is404 = false;

let url = {
	headers: {
		'Content-Type': 'text/html; charset=utf-8',
		'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.101 Safari/537.36 Edg/91.0.864.48',
	},
	uri: 'https://berkat.ru/rabota/vakansii?page=1',
	method: 'POST'
};

let question = () => {
	rl.question("Список доступных комманд (help)\nВведите команду: ", async (answer) => {
		switch (answer) {
			case "help":
				console.log(`
				pars - спарсить объявления
				sort - начать сортировку объявлений
				print - вывести результат
				stop - остановить работу
				`);
				break;
			case "pars":
				await pars(url);
				console.log("Парсинг завершен");
				break;
			case "sort":
				await sort();
				console.log("Отсортировано");
				break;
			case "print":
				print();
				break;
			case "stop":
				console.log("Завершение работы");
				rl.close();
				return;
			default:
				console.log("Неизвестная команда\n");
				question();
		}
		question();
	});
}

let pars = async (url) => {
	if (is404) {
		return;
	}

	await new Promise((resolve) => {
		request(url, function (error, res, html) {
			if (!error && res.statusCode == 200) {
				let $ = cheerio.load(html);
				// Получаем все объявления со страницы
				$(".board_list_item").each((index, element) => {
					// Получаем заголовок объявления
					let title = $(element).find(".board_list_item_title").text().toLowerCase();
					fs.appendFileSync('resultPars.txt', title + "\n");
					resolve();
				})
			} else {
				is404 = true;
			}
		});
	})

	console.log(url.uri);
	url.uri = "https://berkat.ru/rabota/vakansii?page=" + (+url.uri.slice(url.uri.indexOf("=") + 1) + 1);
	setTimeout(() => {
		pars(url)
	}, 300);
}

let sort = async () => {
	let customSort = async (text) => {
		console.log("Требуется помощь кожаного мешка");
		await new Promise((res) => {
			let select = async (message) => {
				// Номер профессии
				let number;
				// Новое ключевое слово
				let word;

				// Список профессий
				let cat = "";
				for (let i = 0; i < Object.keys(categories).length; i++) {
					cat += i + ")" + Object.keys(categories)[i] + " ";
				}

				// Вывод списка профессий
				console.log(cat);
				await new Promise((res) => {
					rl.question('Выберите одну из существующих профессий: ', (index) => {
						number = +index;
						res();
						// rl.close();
					});
				})

				// Вывод заголовка
				console.log(message);
				await new Promise((res) => {
					rl.question('Выберите ключевое слово для профессии: ', (index) => {
						// if (message.indexOf(index) != -1) {
						word = index;
						// } else {
						// word = "-";
						// };
						res();
						// rl.close();
					});
				})

				categories[Object.keys(categories)[number]].push(word);
				categories[Object.keys(categories)[number]][0] += 1;
				console.log("Ключ слово успешно добавлено");
				return;
			}

			let newCategory = async (message) => {
				// Название новой профессии
				let newName;
				// Ключевые слова
				let keyWords;

				await new Promise((res) => {
					rl.question('Выберите название новой профессии: ', (index) => {
						newName = index;
						res();
						// rl.close();
					});
				})

				await new Promise((res) => {
					rl.question('Добавьте ключевые слова для профессии через пробел: ', (index) => {
						if (index == "") {
							categories[newName] = [1, newName];
							res()
						} else {
							keyWords = index.split(" ");
							categories[newName] = [1, newName, ...keyWords];
							res();
						}
						// rl.close();
					});
				})
				console.log("Новая профессия создана");
				return;
			};

			console.log(`
			skip - пропустить
			delete - добавить все слова в исключение
			select (известная профессия) (ключ слово) - добавить ключ
			слово к текущей профессии
			new (новая профессия) (ключ слова через пробел) - создать новую профессию
			stop - остановить работу`);

			console.log(`
			====================================
			${text}
			====================================
			`);

			rl.question('Что делать с этим заголовком? ', async (answer) => {
				switch (answer) {
					case "stop":
						"Завершение работы";
						rl.close();
						break;
					case "skip":
						break;
					case "delete":
						trash = [...trash, ...text];
						console.log(trash);
						break;
					case "new":
						await newCategory(text);
						break;
					case "select":
						await select(text);
						break;
					default:
						console.log("Неизвестная команда\n");
						await customSort(text);
				}
				res();
				// rl.close();
			});

		})
	}

	let trashDelete = async (text) => {
		return await new Promise((res) => {
			let result = text;
			for (let i = 0; i < trash.length; i++) {
				if (result.indexOf(trash[i]) != -1) {
					result.splice(result.indexOf(trash[i]), 1);
				}
			}
			res(result);
		})
	}

	// Делаем массив из заголовков
	let data = await new Promise((res) => {
		res(fs.readFileSync("resultPars.txt", "utf8").split("\n"));
	});

	for (let i = 0; i < data.length; i++) {
		let zag = data[i].split(" ");
		// Флаги для отмены циклов в случае успешного поиска
		let checkedj = false;
		let checkedn = false;
		// Флаг для запуска ручной сортировки в случае неудачи
		let success = false;

		for (let j = 0; j < Object.values(categories).length; j++) {
			if (checkedj) break;
			for (let n = 0; n < Object.values(categories)[j].slice(1).length; n++) {
				if (checkedn) break;
				let item = Object.values(categories)[j].slice(1)[n];
				for (let h = 0; h < zag.length; h++) {
					if (zag[h].indexOf(item) != -1) {
						categories[Object.values(categories)[j][1]][0] += 1;
						console.log("Юху, работаем");
						success = true;
						checkedj = true;
						checkedn = true;
						break;
					}
				}
			}
		}
		if (!success) {
			let zagClean = await trashDelete(zag);

			if (zagClean.join("") != "") {
				await customSort(zagClean);
			}
			success = false;
		}

		fs.writeFileSync('remains.txt', "");
		fs.writeFileSync('remains.txt', JSON.stringify(data.slice(i).join("\n")));
		fs.writeFileSync('statistics.txt', "");
		fs.writeFileSync('statistics.txt', JSON.stringify(categories));
	}

	console.log(categories);
	fs.writeFileSync('statistics.txt', "");
	fs.writeFileSync('statistics.txt', JSON.stringify(categories));
}

let print = () => {
	let arr = [];
	for (let i = 0; i < Object.values(categories).length; i++) {
		let temp = {};
		temp[Object.values(categories)[i][1]] = Object.values(categories)[i][0];
		arr.push(temp);
	}
	console.log(arr.sort((a, b) => Object.values(b)[0] - Object.values(a)[0]));
}

question();
