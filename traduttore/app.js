// Initialize app
var myApp = new Framework7();
 
// If we need to use custom DOM library, let's save it to $$ variable:
var $$ = Dom7;
 
// Add view
var mainView = myApp.addView('.view-main', {
  // Because we want to use dynamic navbar, we need to enable it for this view:
  dynamicNavbar: true
});


var baseUrl = "https://traduttore-api.herokuapp.com/api/v1.0";

//baseUrl = "http://localhost:10010/api/v1.0";

var Events = {
  getEvents : function(cb) {
        var now = (new Date()).toISOString();
        axios.get(baseUrl + "/calendar", {params: {dateFrom: now, dateTo: now}})
        .then(function(response){
          cb.success(response.data);
        })
      .catch(function(error){
        if(cb.error) cb.error(error);
      });  
  }  
};

var EventView = {

  renderEvents: function(data){
    
    var tmpl = $$("#event-tmpl").text();
    $$(".event-list").html("");
    
    data[0].pneeds.forEach(function(event){
    
      var item = tmpl.replace(/{name}/g, event.name).
                      replace(/{category}/g, event.category).
                      replace(/{date}/g, event.startDate).
                      replace(/{indicator}/g, event.event.indicator.valueNum);            
      
      $$(".event-list").append(item);
    });
            
  }
      
};

function reload () {
  Events.getEvents({
    success: function(data){
      console.log(data);
      EventView.renderEvents(data);  
    }
  });
}

$$(".opt-reload").click(function(){
  reload();
});

reload();