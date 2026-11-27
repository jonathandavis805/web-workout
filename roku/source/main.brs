sub Main()
    screen = CreateObject("roSGScreen")
    port = CreateObject("roMessagePort")
    screen.SetMessagePort(port)
    ' roAppManager only works on the main thread, so the player asks for keep-awake through a global flag.
    appManager = CreateObject("roAppManager")
    globalNode = screen.getGlobalNode()
    globalNode.addFields({ keepAwake: false })
    screen.CreateScene("MainScene")
    screen.Show()
    while true
        msg = Wait(30000, port)
        if msg = invalid
            if globalNode.keepAwake then appManager.UpdateLastKeyPressTime()
        else if type(msg) = "roSGScreenEvent" and msg.IsScreenClosed()
            return
        end if
    end while
end sub
