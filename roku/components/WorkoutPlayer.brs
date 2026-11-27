' Mirrors the web player: 1s pause between exercises, 15s rest between rounds.
sub init()
    m.progress = m.top.findNode("progress")
    m.workoutName = m.top.findNode("workoutName")
    m.position = m.top.findNode("position")
    m.phaseLabel = m.top.findNode("phase")
    m.exerciseName = m.top.findNode("exerciseName")
    m.clock = m.top.findNode("clock")
    m.upNext = m.top.findNode("upNext")
    m.hint = m.top.findNode("hint")
    m.nextSound = m.top.findNode("nextSound")
    m.roundSound = m.top.findNode("roundSound")
    m.ticker = m.top.findNode("ticker")
    m.ticker.observeField("fire", "onTick")
    m.appManager = CreateObject("roAppManager")
end sub

sub reset()
    workout = m.top.workout
    m.exercises = workout.exercises
    m.rounds = 1
    if workout.circuits <> invalid and workout.circuits > 1 then m.rounds = workout.circuits
    m.workoutName.text = workout.name
    m.index = 0
    m.round = 0
    m.phase = "work"
    m.timeLeft = m.exercises[0].duration
    m.started = false
    setRunning(false)
    render()
end sub

sub setRunning(running as boolean)
    m.running = running
    if running
        m.started = true
        m.ticker.control = "start"
    else
        m.ticker.control = "stop"
    end if
end sub

sub onTick()
    ' No remote presses during a workout, so keep the screensaver from kicking in.
    if m.appManager <> invalid then m.appManager.UpdateLastKeyPressTime()
    m.timeLeft = m.timeLeft - 1
    if m.timeLeft <= 0
        if m.phase = "work"
            advance()
        else
            if m.phase = "rest" then m.nextSound.control = "play"
            startExercise()
        end if
    end if
    render()
end sub

sub startExercise()
    m.phase = "work"
    m.timeLeft = m.exercises[m.index].duration
end sub

sub advance()
    if m.index < m.exercises.Count() - 1
        m.nextSound.control = "play"
        m.index = m.index + 1
        m.phase = "transition"
        m.timeLeft = 1
    else if m.round < m.rounds - 1
        m.roundSound.control = "play"
        m.round = m.round + 1
        m.index = 0
        m.phase = "rest"
        m.timeLeft = 15
    else
        finish()
    end if
end sub

sub finish()
    setRunning(false)
    m.phase = "done"
    path = "/api/tv/workouts/" + m.top.workout.id.ToStr() + "/complete"
    m.completeTask = startRequest("POST", path, invalid, m.top.token, "")
end sub

sub render()
    if m.phase = "done"
        m.progress.width = 1920
        m.position.text = ""
        m.phaseLabel.text = "WORKOUT COMPLETE"
        m.exerciseName.text = "Great job!"
        m.clock.text = ""
        m.upNext.text = ""
        m.hint.text = "OK to restart  ·  Back for workouts"
        return
    end if

    current = m.exercises[m.index]
    roundNumber = m.round + 1
    exerciseNumber = m.index + 1
    m.position.text = "Round " + roundNumber.ToStr() + " of " + m.rounds.ToStr() + "  ·  " + exerciseNumber.ToStr() + " / " + m.exercises.Count().ToStr()

    if m.phase = "rest"
        m.progress.width = 0
        m.phaseLabel.text = "REST"
        m.exerciseName.text = "Round " + roundNumber.ToStr() + " up next"
        m.clock.text = formatClock(m.timeLeft)
        m.upNext.text = "Up next: " + current.name + " (" + formatDuration(current.duration) + ")"
    else
        shown = current.duration
        if m.phase = "work" then shown = m.timeLeft
        m.progress.width = Int(1920 * (current.duration - shown) / current.duration)
        m.phaseLabel.text = "CURRENT EXERCISE"
        m.exerciseName.text = current.name
        m.clock.text = formatClock(shown)
        if m.index < m.exercises.Count() - 1
            nextExercise = m.exercises[m.index + 1]
            m.upNext.text = "Up next: " + nextExercise.name + " (" + formatDuration(nextExercise.duration) + ")"
        else if m.round < m.rounds - 1
            nextRound = m.round + 2
            m.upNext.text = "Up next: rest, then round " + nextRound.ToStr()
        else
            m.upNext.text = "Last one!"
        end if
    end if

    if not m.started
        m.hint.text = "Press OK to start"
    else if not m.running
        m.hint.text = "Paused  ·  OK to resume  ·  Back for workouts"
    else
        m.hint.text = "OK pause  ·  Left / Right skip  ·  Back for workouts"
    end if
end sub

function formatClock(seconds as integer) as string
    minutes = seconds \ 60
    secs = seconds mod 60
    return Right("0" + minutes.ToStr(), 2) + ":" + Right("0" + secs.ToStr(), 2)
end function

function formatDuration(seconds as integer) as string
    if seconds mod 60 = 0
        minutes = seconds \ 60
        return minutes.ToStr() + "m"
    end if
    return seconds.ToStr() + "s"
end function

function onKeyEvent(key as string, press as boolean) as boolean
    if not press then return false

    if key = "back"
        setRunning(false)
        m.top.exit = true
        return true
    end if

    if key = "OK" or key = "play"
        if m.phase = "done"
            reset()
        else
            setRunning(not m.running)
            render()
        end if
        return true
    end if

    if m.phase = "done" then return false

    if key = "right"
        if m.phase = "work"
            advance()
        else
            startExercise()
        end if
        render()
        return true
    end if

    if key = "left"
        startExercise()
        render()
        return true
    end if

    return false
end function
