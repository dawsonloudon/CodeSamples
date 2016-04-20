views.tracStudentsAction = function(template) {

    this.initialize = function() {
        cache.currentView = 'trac-students-action';
        this.el = $('<div/>');
        this.el.attr('id','trac-students-action');
        this.el.on('change','#sacr-action-list',this.updateAction);
        this.el.on('change','#sacr-date-list',this.updateActionDate);
        this.el.on('change','.printer-switch', this.printSwitch);
        this.el.on('click', '#trac-students-actions-btn', this.completeTrac);
        this.el.on('click', '.backbtn', this.back);
    }

    this.render = function() {
        var printer = (global.usePrinter) ? ' checked' : '';
        var parts = {
            student: cache.student,
            trac: cache.currentTrac,
            nextTrac: cache.nextTrac,
            actions: cache.tracActions,
            dates: cache.actionDates,
            usePrinter: printer,
            stats: {
                printer: '',
                connection: cache.connection
            }
        };
        if(cache.printer.address) {
            parts.stats.printer = 'on';
        }
        else {
            parts.stats.printer = 'off';
        }
        this.el.html(template(parts));
        return this;
    }

    this.updateAction = function() {
        $('#sacr-loading').addClass('active');
        var action = $(this).val();
        var len = cache.tracActions.length;
        for(var i=0;i<len;i++) {
            if(cache.tracActions[i].TracCodeDisciplinaryActionID == action){
                cache.action.name = cache.tracActions[i].ParentDAName;
                cache.action.desc = cache.tracActions[i].Notes;
                cache.nextTrac.DisciplinaryEntries[0].TracCodeDisciplinaryActionID = cache.tracActions[i].TracCodeDisciplinaryActionID;
                cache.nextTrac.DisciplinaryEntries[0].DisciplinaryActionID = cache.tracActions[i].DisciplinaryActionID;
                cache.nextTrac.DisciplinaryEntries[0].MeritValue = cache.tracActions[i].MeritValue;
                api.getActionDates(cache.nextTrac.DisciplinaryEntries[0].DisciplinaryActionID,true);
            }
        }
    }

    this.updateActionDate = function() {
        var date = $(this).val();
        var item_dt = app.helpers.processDT(date);
        cache.nextTrac.DisciplinaryEntries[0].EntryDate = date;
        cache.action.date = date;
        cache.action.dateFormatted = item_dt.date;
        console.log(cache.nextTrac);
        console.log(cache.action);
    }

    this.printSwitch = function() {
        if($(this).is(':checked')) {
            global.usePrinter = true;
        }
        else {
            global.usePrinter = false;
        }
    }

    this.completeTrac = function() {
        if((cache.printer.address != null && global.usePrinter == true) || global.usePrinter == false) {
            if(api.tempAction != null){
                api.tempActionDate = $('#detail-date').val();
            }
            app.slider.slidePageFrom(new views.tracStudentsPass(app.tpl.tracStudentsPass).render().el,'right');
            if(global.usePrinter == true){
                printer.printPass();
            }
            api.saveTracEntry();
        }
        else {
            navigator.notification.confirm('You have not configured a printer',app.helpers.printerPrompt,'No printer selected',['Configure','Cancel']);
        }
    }

    this.back = function() {
        if(cache.students.length > 0) {
            cache.student = [];
            app.slider.slidePageFrom(new views.tracStudentsList(app.tpl.tracStudentsList,cache.students).render().el, 'left');
        }
        else{
            cache.search = {
                id: '',
                name: '',
                vin: '',
                tag: ''
            };
            cache.student = [];
            app.slider.slidePageFrom(new views.tracStudents(app.tpl.tracStudents).render().el,'left');
        }
    }

    this.initialize();

}