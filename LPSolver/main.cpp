#include <Windows.h>

int main()
{
	ShellExecute(nullptr, nullptr, L".\\index.html", nullptr, nullptr, SW_SHOW);
}
