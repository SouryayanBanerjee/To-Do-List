//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-abesh:test123@cluster0.rp9pe.mongodb.net/todolistDB", {
  useNewUrlParser: true,
});

const itemSchema = {
  name: String
};

const Item = mongoose.model("Item", itemSchema);

const listSchema = {
  name: String,
  items: [itemSchema]
};

const List = mongoose.model("List", listSchema);

const item1 = new Item({
  name: "Welcome to your to do list!",
});

const item2 = new Item({
  name: "Hit the + to add items.",
});

const item3 = new Item({
  name: "<-- Hit this to delete item.",
});

const defaultArray = [item1, item2, item3];

Item.find({}, function(err, foundItems) {
  if (foundItems.length === 0) {
    Item.insertMany(defaultArray, function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Successfully Inserted");
      }
    });
  }
});

const day = date.getDate();

app.get("/", function(req, res) {



  Item.find({}, function(err, foundItems) {
    if (err) {
      console.log(err);
    } else {
      res.render("list", {
        listTitle: day,
        newListItems: foundItems
      });
    }
  });
});

app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err, foundList) {
    if(err) {
      console.log(err);
    } else {
      if (!foundList) {
        const list = new List ({
          name: customListName,
          items: defaultArray
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });
});

app.post("/", function(req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item ({
    name: itemName
  });

  if (listName === day) {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList) {
      if (err) {
        console.log(err);
      } else {
        foundList.items.push(item);
        foundList.save();
        res.redirect("/"+ listName);
      }
    });
  }

});

app.post("/delete", function(req,res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === day) {
    Item.deleteOne({_id: checkedItemId}, function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Successfully Deleted");
      }
    });
    res.redirect("/");
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList) {
      if (!err) {
        res.redirect("/" + listName);
      }
    });
  }
});



app.get("/about", function(req, res) {
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server has started);
});
