import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

Fiddles = new Mongo.Collection('fiddles');

Meteor.startup(() => {
  // code to run on server at startup
});

Meteor.methods({
  'fiddle.save': function(content) {
    return Fiddles.insert({
      content: content,
      createdAt: new Date()
    });
  }
})

Meteor.publish('fiddle', function (id) {
  return Fiddles.find({_id: id});
});
