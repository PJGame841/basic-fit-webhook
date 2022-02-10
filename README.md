# basic-fit-webhook
WebHook to book at Basic-Fit

Just a little tool to be connected with google assistant to make automatic booking at Basic-Fit :)

At the moment it's only working for me but if you want you can clone the project and adapt it on your own.
If you do so, you'll need to edit your favorite club, and the doorPolicyId (you can get it by doing inspecting how a booking is done on https://my.basic-fit.com/gym-time-booking)

You have two env variables to setup:
- APP_SPECIALCODE (a code to make the request)
- APP_BASICFITMAIL (your basic fit email)
- APP_BASICFITPASSWORD (your basic fit password)

## Endpoints

/make-reservation?specialCode=APP_SPECIALCODE&sessionId=<connect.sid header> -- the sessionId parameter is optionnal, if it's not provided, it'll try to login to basic fit
/test -- used to check the next booking hour

Good luck !
