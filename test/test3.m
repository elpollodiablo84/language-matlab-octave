%% SCRIPT
if a1
    %% IF
    a = 1;
    %% IF
    b = 2;
elseif a2
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

        if fun(d)
            %% IF
            d = d + 1;
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
    end

    y = y + 1;
end
