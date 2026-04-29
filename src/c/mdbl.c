#include <pebble.h>

int main(void) {
	Window *w = window_create();
	window_stack_push(w, true);

#ifdef ALLOY_INSTRUMENTATION
	ModdableCreationRecord creation = {
		.recordSize = sizeof(ModdableCreationRecord),
		.flags = kModdableCreationFlagLogInstrumentation,
	};
	moddable_createMachine(&creation);
#else
	moddable_createMachine(NULL);
#endif

	window_destroy(w);
}
