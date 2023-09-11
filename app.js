//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
require("dotenv").config(); // Load the .env file

mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
});

const itemSchema = new mongoose.Schema({
  name: String,
});

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemSchema],
});

const Item = mongoose.model("Item", itemSchema);
const List = mongoose.model("List", listSchema);
const item = new Item({ name: "test" });
const item1 = new Item({ name: "test1" });
const item2 = new Item({ name: "test2" });

const defaultItems = [item, item1, item2];
async function insertItemAll(items) {
  try {
    await Item.insertMany(items);
    // console.log(insertItem);
  } catch (error) {
    console.log(error);
  }
}

//InsertItemAll();

async function findAllItems() {
  try {
    const findItems = await Item.find();
    return findItems;
  } catch (error) {
    console.log(error);
    return [];
  }
}

async function findOneName(customListName) {
  await List.findOne({ name: customListName });
}

app.get("/", async function (req, res) {
  const day = date.getDate();
  const getItem = await findAllItems();
  // console.log(getItem);
  if (getItem.length === 0) {
    await insertItemAll(defaultItems);
    res.redirect("/");
  } else {
    res.render("list", { listTitle: day, newListItems: getItem });
  }
});

app.post("/", async function (req, res) {
  const newItemList = new Item({ name: req.body.newItem });
  const listName = req.body.list;

  if (listName === date.getDate()) {
    newItemList.save();
    res.redirect("/");
  } else {
    const foundList = await List.findOne({ name: listName });
    if (foundList) {
      foundList.items.push(newItemList);
      await foundList.save();
      res.redirect(`/${listName}`);
    }
  }
});

app.post("/delete", async function (req, res) {
  const checkItemId = req.body.checkbox;
  const listName = req.body.listName;
  console.log(listName);

  if (listName === date.getDate()) {
    await Item.deleteOne({ _id: checkItemId });
    res.redirect("/");
  } else {
    const foundList = await List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkItemId } } }
    );
    if (foundList) {
      res.redirect(`/${listName}`);
    }
  }
});

app.get(`/:customListName`, async function (req, res) {
  const customListName = _.capitalize(req.params.customListName);
  // console.log(customListName);
  const getListName = await List.findOne({ name: customListName });
  // console.log(getListName);
  if (getListName === null) {
    const list = new List({
      name: customListName,
      items: defaultItems,
    });
    list.save();
    res.redirect(`/${customListName}`);
  } else {
    res.render("list", {
      listTitle: getListName.name,
      newListItems: getListName.items,
    });
  }
});
app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
