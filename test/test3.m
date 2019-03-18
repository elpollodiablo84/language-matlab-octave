%% SCRIPT
if a1
    %% IF
    a = 1;
    %% IF
    b = 2;

    elseiffo = false; % False elseif!
    clear elseiffo
elseif (a2 == 3)
    %% ELSEIF
    for i = 1:10
        %% FOR
        c = 3;

        while c == 2
            %% WHILE
            c = 3;
        end

        %% FOR
        c = 0;
    end
elseif a3
    %% ELSEIF
    try a4
        %% TRY
        for i = 1:3
            %% FOR
            d = 0;
        end

        catching = 0; % False catch!
        clear catching

        if fun(d)
            %% IF
            d = d + 1;
            endGame = 1; % False end!
            clear endGame
        end
    catch
        %% CATCH
        e = 4;
    end
else
    %% ELSE
    f = 4;
end

%% FUNCTION OUT
function y = fun(x)
    %% FUNCTION IN
    y = inner(x);

    function z = inner(x)
        %% FUNCTION INNER
        z = x;
        switch x
            %% SWITCH
            case 1
                %% CASE
                z = 1;
                caseee = 2; % False case!
                clear caseee

            otherwise
                %% OTHERWISE
                z = 2;
        end
    end

    y = y + 1;
end
