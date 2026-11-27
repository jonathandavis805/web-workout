sub init()
    m.list = m.top.findNode("list")
    m.message = m.top.findNode("message")
    m.list.observeField("itemSelected", "onItemSelected")
end sub

sub loadWorkouts()
    m.message.text = "Loading workouts..."
    m.task = startRequest("GET", "/api/tv/workouts", invalid, m.top.token, "onWorkoutsLoaded")
end sub

sub onWorkoutsLoaded(event as object)
    response = event.getData()
    if response.status = 401 or response.status = 403
        m.top.unauthorized = true
        return
    end if
    if response.status <> 200
        m.message.text = "Can't reach Gruuve. Press * to try again."
        return
    end if

    m.workouts = response.data
    content = CreateObject("roSGNode", "ContentNode")
    for each workout in m.workouts
        item = content.createChild("ContentNode")
        item.title = workout.name + "     " + describe(workout)
    end for
    m.list.content = content
    m.list.setFocus(true)
    if m.workouts.Count() = 0
        m.message.text = "No workouts yet. Create one on the Gruuve website, then press * to refresh."
    else
        m.message.text = ""
    end if
end sub

function describe(workout as object) as string
    seconds = 0
    for each exercise in workout.exercises
        seconds = seconds + exercise.duration
    end for
    rounds = 1
    if workout.circuits <> invalid and workout.circuits > 1 then rounds = workout.circuits
    minutes = (seconds * rounds + 30) \ 60
    text = workout.exercises.Count().ToStr() + " exercises"
    if rounds > 1 then text = text + " · " + rounds.ToStr() + " rounds"
    return text + " · " + minutes.ToStr() + " min"
end function

sub onItemSelected(event as object)
    workout = m.workouts[event.getData()]
    if workout.exercises.Count() > 0 then m.top.selectedWorkout = workout
end sub

function onKeyEvent(key as string, press as boolean) as boolean
    if press and key = "options"
        loadWorkouts()
        return true
    end if
    return false
end function
