sub init()
    m.registry = CreateObject("roRegistrySection", "gruuve")
    m.screen = invalid
    m.launchSignaled = false
    if m.registry.Exists("token")
        showWorkoutList()
    else
        showPairing()
    end if
end sub

sub showScreen(screen as object)
    if m.screen <> invalid then m.top.removeChild(m.screen)
    m.screen = screen
    m.top.appendChild(screen)
    screen.setFocus(true)
    if not m.launchSignaled
        m.top.signalBeacon("AppLaunchComplete")
        m.launchSignaled = true
    end if
end sub

sub showPairing()
    screen = CreateObject("roSGNode", "PairScreen")
    screen.observeField("token", "onPaired")
    showScreen(screen)
end sub

sub onPaired(event as object)
    m.registry.Write("token", event.getData())
    m.registry.Flush()
    showWorkoutList()
end sub

sub showWorkoutList()
    screen = CreateObject("roSGNode", "WorkoutListScreen")
    screen.observeField("selectedWorkout", "onWorkoutSelected")
    screen.observeField("unauthorized", "onUnauthorized")
    showScreen(screen)
    screen.token = m.registry.Read("token")
end sub

sub onUnauthorized()
    m.registry.Delete("token")
    m.registry.Flush()
    showPairing()
end sub

sub onWorkoutSelected(event as object)
    screen = CreateObject("roSGNode", "WorkoutPlayer")
    screen.observeField("exit", "showWorkoutList")
    showScreen(screen)
    screen.token = m.registry.Read("token")
    screen.workout = event.getData()
end sub
