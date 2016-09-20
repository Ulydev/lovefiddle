//Routes

Router.route('/:_id?', {
  waitOn: function() {
    return Meteor.subscribe('fiddle', this.params._id);
  },
  data: function() {
    return Fiddles.findOne({ _id: this.params._id});
  },
  action: function () {
    if (this.ready()) {
      this.render('main');
    }
    else {
      ; //this.render('loading');
    }
  },
  name: 'fiddle.show'
});
