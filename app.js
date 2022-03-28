const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
var format = require("date-fns/format");
var isValid = require("date-fns/isValid");

let db;
const dbpath = path.join(__dirname, "todoApplication.db");

const app = express();
app.use(express.json());

const initializeDb = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => console.log("server is running at 3000"));
  } catch (error) {
    console.log(error.message);
  }
};

initializeDb();

// Api 1
const convertingToList = (value) => {
  return {
    id: value.id,
    todo: value.todo,
    priority: value.priority,
    status: value.status,
    category: value.category,
    due_date: value.due_date,
  };
};

const validQuery = (status, priority, category) => {
  let isStatus;
  let isCategory;
  let isPriority;

  if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
    isStatus = true;
  } else {
    isStatus = false;
  }

  if (category === "WORK" || category === "HOME" || category === "LEARNING") {
    isCategory = true;
  } else {
    isCategory = false;
  }

  if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
    isPriority = true;
  } else {
    isPriority = false;
  }

  return { isStatus, isCategory, isPriority };
};

app.get("/todos/", async (request, response) => {
  const { status, priority, search_q = "", category } = request.query;

  let a = validQuery(status, priority, category);
  console.log(a);
  let query1;
  let query1Db;

  const wrongInput = (a, b, c) => {
    response.status(400);

    if (b !== undefined) {
      response.send("Invalid Todo Priority");
    } else if (a !== undefined) {
      response.send("Invalid Todo Status");
    } else {
      response.send("Invalid Todo Category");
    }
  };

  switch (true) {
    case a.isCategory === true && a.isPriority == true:
      query1 = `
        SELECT 
            *
        FROM 
            todo
        WHERE 
            priority = '${priority}'
            AND category = '${category}'`;

      query1Db = await db.all(query1);

      response.send(query1Db.map((value) => convertingToList(value)));
      //   console.log("categorypriority");

      break;

    case a.isCategory === true && a.isStatus === true:
      query1 = `
        SELECT 
            *
        FROM 
            todo
        WHERE 
            status = '${status}'
            AND category = '${category}'`;

      query1Db = await db.all(query1);
      response.send(query1Db.map((value) => convertingToList(value)));
      //   console.log("statuscategory");
      break;

    case a.isPriority === true && a.isStatus === true:
      query1 = `
        SELECT 
            *
        FROM 
            todo
        WHERE 
            priority = '${priority}'
            AND status = '${status}'`;
      query1Db = await db.all(query1);
      response.send(query1Db.map((value) => convertingToList(value)));
      //  console.log("prioritystatus");
      break;

    case search_q !== "":
      query1 = `
        SELECT 
            *
        FROM 
            todo
        WHERE 
            todo LIKE '%${search_q}%'`;
      //console.log("search_q");
      query1Db = await db.all(query1);
      response.send(query1Db.map((value) => convertingToList(value)));
      break;

    case a.isStatus === true:
      query1 = `
        SELECT 
            *
        FROM 
            todo
        WHERE 
            status = '${status}'`;

      query1Db = await db.all(query1);
      response.send(query1Db.map((value) => convertingToList(value)));
      // console.log("status");
      break;

    case a.isPriority === true:
      query1 = `
        SELECT 
            *
        FROM 
            todo
        WHERE 
            priority = '${priority}'`;

      query1Db = await db.all(query1);
      response.send(query1Db.map((value) => convertingToList(value)));
      //  console.log("priority");
      break;

    case a.isCategory === true:
      query1 = `
        SELECT 
            *
        FROM 
            todo
        WHERE 
            category = '${category}'`;
      query1Db = await db.all(query1);
      response.send(query1Db.map((value) => convertingToList(value)));
      break;

    default:
      wrongInput(status, priority, category);

      query1Db = await db.all(query1);
      response.send(query1Db.map((value) => convertingToList(value)));
  }
});

//api 2

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const query2 = `
    SELECT 
      *
    FROM 
      todo
    WHERE 
      id = ${todoId}`;

  const query2Db = await db.get(query2);
  response.send(query2Db);
});

module.exports = app;

// api 3

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const Date1 = date.split("-");
  const valid = isValid(new Date(Date1[0], Date1[1] - 1, Date1[2]));
  if (valid) {
    var result = format(
      new Date(Date1[0], Date1[1] - 1, Date1[2]),
      "yyyy-MM-dd"
    );
    const query3 = `
    SELECT 
      *
    FROM 
      todo
    WHERE 
      due_date = '${result}'`;

    const query3Db = await db.all(query3);
    response.send(query3Db /*.map((value) => convertingToList(value))*/);
  }
});

// api 4
const checkingValues = (priority, status, category, due_date) => {
  let addTodo1 = false;
  let addTodo2 = false;
  let addTodo3 = false;
  console.log(priority, status, category);
  let wrongitem;

  if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
    addTodo1 = true;
  } else {
    wrongitem = "Status";
  }

  if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
    addTodo2 = true;
  } else {
    console.log("running");
    wrongitem = "Priority";
  }

  if (category === "WORK" || category === "HOME" || category === "LEARNING") {
    addTodo3 = true;
  } else {
    wrongitem = "Category";
  }

  return { addTodo1, addTodo2, addTodo3, wrongitem };
};

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, due_date } = request.body;
  let dataTrue = checkingValues(priority, status, category, due_date);
  console.log(
    dataTrue.addTodo1,
    dataTrue.addTodo2,
    dataTrue.addTodo3,
    dataTrue.wrongitem
  );
  if (dataTrue.addTodo1 && dataTrue.addTodo2 && dataTrue.addTodo3) {
    const query4 = `
  INSERT INTO 
    todo
  (id,todo,priority,status,category,due_date)
  VALUES 
  (${id},'${todo}','${priority}','${status}','${category}','${due_date}');`;

    await db.run(query4);
    response.send("Todo Successfully Added");
  } else {
    response.status(400);
    response.send(`Invalid Todo ${dataTrue.wrongitem}`);
  }
});

// api 5

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const { status, priority, todo, category, dueDate } = request.body;
  let updatedIs;
  let query5;
  let correctValue;

  console.log(todo, priority, status, category, dueDate);
  switch (true) {
    case status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        correctValue = true;
        query5 = `
    UPDATE
      todo
    SET 
    status = '${status}'
    WHERE
      id = ${todoId}`;

        updatedIs = "Status";
      } else {
        correctValue = false;
        updatedIs = "Status";
      }

      break;

    case priority !== undefined:
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        correctValue = true;
        query5 = `
    UPDATE
      todo
    SET 
    priority = '${priority}'
    WHERE
      id = ${todoId}`;

        updatedIs = "Priority";
      } else {
        correctValue = false;
        updatedIs = "Priority";
      }

      break;

    case todo !== undefined:
      correctValue = true;
      query5 = `
    UPDATE
      todo
    SET 
    todo = '${todo}'
    WHERE
      id = ${todoId}`;

      updatedIs = "Todo";

      break;

    case category !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        correctValue = true;
        query5 = `
    UPDATE
      todo
    SET 
    category = '${category}'
    WHERE
      id = ${todoId}`;

        updatedIs = "Category";
      } else {
        correctValue = false;
        updatedIs = "Category";
      }

      break;
    default:
      const Date2 = dueDate.split("-");
      var formatDate = format(
        new Date(Date2[0], Date2[1] - 1, Date2[2]),
        "yyyy-MM-dd"
      );
      if (dueDate === formatDate) {
        correctValue = true;
        query5 = `
    UPDATE
      todo
    SET 
    due_date = '${dueDate}'
    WHERE
      id = ${todoId}`;

        updatedIs = "Due Date";
      } else {
        correctValue = false;
        updatedIs = "Due Date";
      }
  }
  if (correctValue) {
    await db.run(query5);
    response.send(`${updatedIs} Updated`);
  } else {
    response.status(400);
    response.send(`Invalid Todo ${updatedIs}`);
  }
});

// api 6

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const query6 = `
    DELETE FROM todo
    WHERE id = ${todoId}`;

  await db.run(query6);
  response.send("Todo Deleted");
});
